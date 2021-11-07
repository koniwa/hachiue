var wavesurfer; // eslint-disable-line no-var
/* global WaveSurfer */
/* global localforage */
/* global bootstrap */
/* global JSONEditor */

const key_audio = 'key_audio_0';
const key_annotation = 'key_annotation_0';
const key_meta = 'key_meta_0';
const item_name_annotation = 'annotation';
const item_name_meta = 'meta';
const key_annotation_item_names = 'key_annotation_item_names';
const default_annotation_item_names = ['text_level0', 'kana_level0', 'text_level2', 'kana_level3'];



function load_audio(file) {
  if (file === null) {
    return;
  }
  {
    document.getElementById('title').innerText = `${file.name}`;
    document.title = `${file.name} - Hachiue`;
  }

  const url_file = URL.createObjectURL(file);
  const slider = document.querySelector('#slider');
  slider.oninput = function() {
    const zoomLevel = Number(slider.value);
    wavesurfer.zoom(zoomLevel);
  };
  wavesurfer.load(url_file);
}

function load_files(files) {
  Array.from(files).forEach(
    f => {
      if (f.type.match(/audio\/*/)) { /**/
        load_audio(f);

        localforage.setItem(key_audio, f).catch(err => {
          alert(err);
        });

      } else if (f.type == 'application/json') {
        wavesurfer.clearRegions();

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const d = JSON.parse(reader.result);
            loadRegions(d[item_name_annotation]);

            //meta
            localforage.setItem(key_meta, d[item_name_meta],
              () => { // on success
              }).catch((err) => {
              alert(`Error on save: ${err}`);
            });

          } catch (error) {
            alert(error);
          }
          saveRegions();
        };
        reader.readAsText(f);
      } else {
        alert(`Unsupported file type ${f.type}`);
      }
    });
}

function init_wavesurfer() {
  {
    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      height: 150,
      pixelRatio: 1,
      skipLength: 0.5,
      scrollParent: true,
      normalize: true,
      minimap: true,
      backend: 'MediaElement',
      cursorColor: 'red',
      plugins: [
        WaveSurfer.regions.create(),
        WaveSurfer.minimap.create({
          height: 30,
          waveColor: '#ddd',
          progressColor: '#999',
        }),
        WaveSurfer.timeline.create({
          container: '#wave-timeline',
          cursorColor: 'red'
        })
      ]
    });

    wavesurfer.on('audioprocess', function() {
      if (wavesurfer.isPlaying()) {
        const currentTime = wavesurfer.getCurrentTime();
        document.getElementById('time-current').innerText = currentTime.toFixed(1);
      }
    });


    localforage.getItem(key_annotation, (err, data_annotation) => {
      if (data_annotation === null) {
        return;
      }
      loadRegions(data_annotation);
    });

    localforage.getItem(key_audio, (err, data_audio) => {
      load_audio(data_audio);
    });
  }

  {
    // Regions

    wavesurfer.on('ready', function() {
      wavesurfer.enableDragSelection({
        color: randomColor(0.1)
      });

      const totalTime = wavesurfer.getDuration();
      document.getElementById('time-total').innerText = totalTime.toFixed(1);
    });
    wavesurfer.on('region-click', function(region, e) {
      e.stopPropagation();
      // Play on click, loop on shift click
      e.shiftKey ? region.playLoop() : region.play();
    });
    wavesurfer.on('region-click', editAnnotation);
    wavesurfer.on('region-updated', saveRegions);
    wavesurfer.on('region-removed', saveRegions);

    wavesurfer.on('region-play', function(region) {
      wavesurfer.play(region.start, region.end);
    });
  }

  {
    // play

    let playButton = document.querySelector('#play');
    let pauseButton = document.querySelector('#pause');
    wavesurfer.on('play', function() {
      playButton.style.display = 'none';
      pauseButton.style.display = '';
    });
    wavesurfer.on('pause', function() {
      playButton.style.display = '';
      pauseButton.style.display = 'none';
    });


    document.querySelector(
      '[data-action="delete-region"]'
    ).addEventListener('click', function() {
      let form = document.forms.edit;
      let regionId = form.dataset.region;
      if (regionId) {
        wavesurfer.regions.list[regionId].remove();
        form.reset();
      }
    });
  }


  {
    // Zoom slider
    let slider = document.querySelector('#slider');

    slider.value = wavesurfer.params.minPxPerSec;
    slider.min = wavesurfer.params.minPxPerSec;
    // Allow extreme zoom-in, to see individual samples
    slider.max = 1000;

    slider.addEventListener('input', function() {
      wavesurfer.zoom(Number(this.value));
    });

    // set initial zoom to match slider value
    wavesurfer.zoom(slider.value);
  }

  {
    // Volume
    const volumeInput = document.querySelector('#volume');
    const onChangeVolume = function(e) {
      wavesurfer.setVolume(e.target.value);
    };
    volumeInput.addEventListener('input', onChangeVolume);
    volumeInput.addEventListener('change', onChangeVolume);

    document.getElementById('volume_zero').addEventListener('click', () => {
      wavesurfer.setVolume(0);
      volumeInput.value = 0;
    });
    document.getElementById('volume_max').addEventListener('click', () => {
      wavesurfer.setVolume(1);
      volumeInput.value = 1;
    });

  }

  {
    // UI
    document.getElementById('title').innerText = 'Hachiue';
    document.title = 'Hachiue';
    document.getElementById('time-total').innerText = '0.00';
    document.getElementById('time-current').innerText = '0.00';
    const form = document.forms.edit;
    form.style.opacity = 0;
  }
}

function clear_annotations() {

  localforage.removeItem(key_annotation, () => {}
  ).catch((err) => {
    alert(err);
  });

  wavesurfer.clearRegions();
  old_region = null;
}


const escape_html_map = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;',
};


document.addEventListener('DOMContentLoaded', function() {

  localforage.getItem(key_annotation_item_names, (err, annotation_item_names) => {
    if (annotation_item_names === null) {
      annotation_item_names = default_annotation_item_names;
      localforage.setItem(key_annotation_item_names, annotation_item_names, () => {});
    }

    const area = document.getElementById('annotation_item_area');
    let row_idx = 0;
    for (let j = 0; j < annotation_item_names.length; ++j) {
      const item_name = annotation_item_names[j].replace(/[&"<>]/g, e => escape_html_map[e]);
      if (j % 2 == 0) {
        area.innerHTML += `<div class="form-group row" id="annotation_item_row_${row_idx}">
                <div class="col" id="annotation_item_${j}">
                </div>
                <div class="col" id="annotation_item_${j + 1}">
                </div>
            </div>`;
        row_idx += 1;
      }
      const row = document.getElementById(`annotation_item_${j}`);
      row.innerHTML = `
                <div class="col">
                    <label for="vals__${item_name}">${item_name}</label>
                    <textarea id="vals__${item_name}" class="form-control" name="vals__${item_name}"></textarea>
                </div>
        `;
    }
  });



  init_wavesurfer();

  { // Reset
    const resetButton = document.querySelector('#reset');
    resetButton.addEventListener('click', () => {
      if (!confirm('Clear all?')) {
        return;
      }

      clear_annotations();

      localforage.removeItem(key_audio, () => {}
      ).catch((err) => {
        alert(err);
      });

      wavesurfer.empty();
      wavesurfer.destroy();
      init_wavesurfer();
    });
  }

  { // VAD
    const vadButton = document.querySelector('#vad');
    vadButton.addEventListener('click', () => {
      if (!confirm('VAD? (All annotations will be cleared)')) {
        return;
      }
      clear_annotations();
      const duration = wavesurfer.getDuration();
      const unit_second = 0.01;
      const num_subranges = parseInt(duration / unit_second);
      loadRegions(
        extractRegions(
          wavesurfer.backend.getPeaks(num_subranges),
          duration,
          unit_second,
        )
      );
      saveRegions();
    });
  }


  { // meta editor
    const modal = document.querySelector('#edit_meta');
    const container = document.getElementById('jsoneditor');
    const options = {
      mode: 'code',
    };
    const editor = new JSONEditor(container, options);
    modal.addEventListener('click', () => {
      localforage.getItem(key_meta, (_, data) => {
        if (data === null) {
          data = {};
        }
        editor.set(data);
      });
    });


    const modal_save = document.querySelector('#metaModal_save');
    modal_save.addEventListener('click', () => {
      try {
        const updatedJson = editor.get();
        localforage.setItem(key_meta, updatedJson,
          () => { // on success
            const modal = document.getElementById('metaModal');
            bootstrap.Modal.getInstance(modal).hide();
          }).catch((err) => {
          alert(`Error on save: ${err}`);
        });
      } catch (e) {
        alert(e);
        return;
      }
    });
  }


  { // config editor
    const modal = document.querySelector('#configModal');
    modal.addEventListener('show.bs.modal', function() {
      localforage.getItem(key_annotation_item_names, (_, data) => {
        document.getElementById('config_annotation_item_names').value = data;
        console.log(data);
      });
    });


    const modal_save = document.querySelector('#configModal_save');
    modal_save.addEventListener('click', () => {
      const new_val = [];
      document.getElementById('config_annotation_item_names').value.split(',').forEach((v) => {
        new_val.push(v.replace(/^\s*(.*?)\s*$/, "$1"));
      });
      try {
        localforage.setItem(key_annotation_item_names, new_val,
          () => { // on success
            const modal = document.getElementById('configModal');
            bootstrap.Modal.getInstance(modal).hide();
          }).catch((err) => {
          alert(`Error on save: ${err}`);
        });
      } catch (e) {
        alert(e);
        return;
      }
    });



  }

  {
    // Disable D&D
    window.addEventListener('dragover', function(ev) {
      ev.preventDefault();
    }, false);
    window.addEventListener('drop', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }, false);

    // cf: https://r17n.page/2020/10/24/html-js-drag-and-drop-file/
    document.querySelectorAll('#file-select-button, #drag-and-drop-area').forEach((ele) => {
      ele.addEventListener('click', () => {
        document.getElementById('file-select-input').click();
      });
    });

    const dragAndDropArea = document.getElementById('drag-and-drop-area');

    dragAndDropArea.addEventListener('dragover', (event) => {
      dragAndDropArea.classList.add('active');
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });

    dragAndDropArea.addEventListener('dragleave', () => {
      dragAndDropArea.classList.remove('active');
    });

    dragAndDropArea.addEventListener('drop', (event) => {
      event.preventDefault();
      dragAndDropArea.classList.remove('active');
      const files = event.dataTransfer.files;
      load_files(files);
    });

    document.getElementById('file-select-input').addEventListener('change', (e) => {
      load_files(e.target.files);
    });
  }



  document.getElementById('download_button').addEventListener('click', () => {
    const dd = new Date();
    const YYYY = dd.getFullYear();
    const MM = (dd.getMonth() + 1).toString().padStart(2, '0');
    const DD = dd.getDate().toString().padStart(2, '0');
    const hh = dd.getHours().toString().padStart(2, '0');
    const mm = dd.getMinutes().toString().padStart(2, '0');
    const ss = dd.getSeconds().toString().padStart(2, '0');
    const date_str = `${YYYY}-${MM}-${DD}-${hh}_${mm}_${ss}`;

    const name = `annotations_${date_str}.json`;


    localforage.getItem(key_annotation, (err, data_annotation) => {
      data_annotation.sort((a, b) => {
        if (a.start < b.start) {
          return -1;
        }
        return 1;
      });

      localforage.getItem(key_meta, (err, data_meta) => {
        if (data_meta === null) {
          data_meta = {};
        }

        const out_data = {};
        out_data[item_name_annotation] = data_annotation;
        out_data[item_name_meta] = data_meta;

        const out = JSON.stringify(out_data, undefined, 4) + '\n';
        const url = URL.createObjectURL(new Blob([out], {
          type: 'application/json'
        }));
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.download = name;
        a.href = url;
        a.click();
        a.remove();
      });
    });
  });


  document.addEventListener('keydown', (e) => {
    if (!e.shiftKey) {
      return;
    }
    switch (e.keyCode) {
      case 32: // space
        wavesurfer.playPause();
        e.preventDefault();
        break;
      case 37: // left
        wavesurfer.skipBackward();
        e.preventDefault();
        break;
      case 39: // right
        wavesurfer.skipForward();
        e.preventDefault();
        break;
      default:
        break;
    }
  });


});

function saveRegions() {
  const mydata = Object.keys(wavesurfer.regions.list).map(function(id) {
    const region = wavesurfer.regions.list[id];
    return {
      start: region.start,
      end: region.end,
      data: region.data
    };
  });

  localforage.setItem(key_annotation, mydata,
    () => { // on success
    }).catch((err) => {
    alert(`Error on save: ${err}`);
  });
}

function loadRegions(regions) {
  regions.forEach(function(region) {
    region.color = randomColor(0.1);
    wavesurfer.addRegion(region);
  });
}

function randomColor(alpha) {
  return (
    'rgba(' +
    [
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      alpha || 1
    ] +
    ')'
  );
}


function save_a_region(region) {
  const form = document.forms.edit;
  const data = {};
  for (const [key, el] of Object.entries(form.elements)) {
    if (key.startsWith('vals__')) {
      let v = el.value;
      if (key != 'vals__memo') {
        // Clean blanks and line breaks
        v = v.replace(/^\s+|\s+$|\n/g, '');
      }
      data[key.substr('vals__'.length)] = v;
    }
  }

  region.update({
    start: form.elements.start.value,
    end: form.elements.end.value,
    data: data,
  });
  form.style.opacity = 0;

}

var old_region = null;
function editAnnotation(region) {
  if (old_region !== null && region != old_region) {
    save_a_region(old_region);
  }
  old_region = region;

  const form = document.forms.edit;
  form.style.opacity = 1;
  (form.elements.start.value = Math.round(region.start * 100) / 100),
  (form.elements.end.value = Math.round(region.end * 100) / 100);

  for (const [key, el] of Object.entries(form.elements)) {
    if (key.startsWith('vals__')) {
      const mykey = key.substr('vals__'.length);
      el.value = region.data[mykey] || '';
    }
  }

  form.onsubmit = function(e) {
    e.preventDefault();
    save_a_region(region);
  };
  form.onreset = function() {
    form.style.opacity = 0;
    form.dataset.region = null;
  };
  form.dataset.region = region.id;
}





function extractRegions(peaks, duration, unit_second) {
  const minValue = 0.005;
  const max_interval = 50;

  const sound_on_indices = [];
  for (let j = 0; j < peaks.length / 2; j++) {
    if (Math.abs(peaks[j * 2 + 1]) >= minValue) {
      sound_on_indices.push(j);
    }
  }

  const spans = [];
  sound_on_indices.forEach(function(val) {
    if (spans.length == 0 || val - spans[spans.length - 1].end > max_interval) {
      spans.push({
        'start': val,
        'end': val + 1,
      });
    } else {
      spans[spans.length - 1].end = val;
    }
  });

  return spans.map(function(reg) {
    return {
      start: Math.round(reg.start * unit_second * 100) / 100,
      end: Math.round(reg.end * unit_second * 100) / 100
    };
  });
}

