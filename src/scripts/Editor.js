var tpl_timeline = require('html!./templates/timeline.tpl.html');
var Timeline = require('./graph/Timeline.coffee');
var PropertiesEditor = require('./editor/PropertiesEditor.coffee');
import EditorMenu from './editor/EditorMenu';
import EditorControls from './editor/EditorControls';
var SelectionManager = require('./editor/SelectionManager.coffee');
import Exporter from './editor/Exporter';
var UndoManager = require('./editor/UndoManager.coffee');

class Editor {
  constructor(tweenTime, options = {}) {
    this.tweenTime = tweenTime;
    this.options = options;
    this.timer = this.tweenTime.timer;
    this.lastTime = -1;

    this.$timeline = $(tpl_timeline);
    $('body').append(this.$timeline);
    $('body').addClass('has-editor');

    this.selectionManager = new SelectionManager(this.tweenTime);
    this.exporter = new Exporter(this);
    this.timeline = new Timeline(this);

    this.propertiesEditor = new PropertiesEditor(this, this.selectionManager);
    this.propertiesEditor.keyAdded.add(this.onKeyAdded);
    this.propertiesEditor.keyRemoved.add(this.onKeyRemoved);

    this.menu = new EditorMenu(this.tweenTime, this.$timeline, this);
    if (this.options.onMenuCreated != null) {
      this.options.onMenuCreated(this.$timeline.find('.timeline__menu'));
    }

    this.controls = new EditorControls(this.tweenTime, this.$timeline);
    this.undoManager = new UndoManager(this);

    // Will help resize the canvas to correct size (minus sidebar and timeline)
    window.editorEnabled = true;
    window.dispatchEvent(new Event('resize'));
    window.requestAnimationFrame(() => this.update());
  }

  onKeyAdded() {
    this.undoManager.addState();
    this.render(false, true);
  }

  onKeyRemoved(item) {
    this.selectionManager.removeItem(item);
    this.undoManager.addState();
    if (this.selectionManager.selection.length) {
      this.selectionManager.triggerSelect();
    }
    this.render(false, true);
  }

  render(time = false, force = false) {
    if (time === false) {
      time = this.timer.time[0];
    }
    if (force) {
      this.timeline._isDirty = true;
    }
    this.timeline.render(time, force);
    this.controls.render(time, force);
    this.propertiesEditor.render(time, force);
  }

  update() {
    var time = this.timer.time[0];
    var time_changed = this.lastTime === time ? false : true;

    this.render(time, time_changed);
    this.lastTime = this.timer.time[0];
    window.requestAnimationFrame(() => this.update());
  }
}

module.exports = Editor;
