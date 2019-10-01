"use strict";

/* eslint-disable no-undef */
window.state = {
  str: "Hello world!",
  bool: true,
  time: 'Waiting',
  arr: [{
    num: 10
  }, {
    num: 20
  }, {
    num: 30
  }]
};
var Counter = {
  template: "\n        <div>\n            Counter: \n            <button \n                :text=\"$props.val.num\"\n                @click=\"$methods.addOne();\"\n            ></button>\n            <slot></slot>\n        </div>",
  methods: function methods() {
    return {
      addOne: function addOne() {
        this.props.val.num++;
        this.root.render();
      }
    };
  }
};
window.app = new Colon({
  el: "#app",
  data: window.state,
  mounted: function mounted() {
    window.setInterval(this.methods.updateTime, 1000);
  },
  methods: {
    updateTime: function updateTime() {
      this.data.time = new Date().toLocaleString();
      this.render();
    }
  },
  components: {
    CounterComponent: Counter
  },
  directives: {
    "^:md$": function md$(_ref) {
      var $app = _ref.$app,
          $value = _ref.$value,
          $this = _ref.$this;
      var md = new markdownit();
      var newValue = $app.run($value);
      $this.innerHTML = md.render(newValue);
    }
  }
});
