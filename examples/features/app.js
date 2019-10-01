/* eslint-disable no-undef */

window.state = {
    str:"Hello world!",
    bool:true,
    time: 'Waiting',
    arr:[{num:10},{num:20},{num:30},],
};

var Counter = {
    template: `
        <div>
            Counter: 
            <button 
                :text="$props.val.num"
                @click="$methods.addOne();"
            ></button>
            <slot></slot>
        </div>`,
    methods: () => ({
        addOne(){
            this.props.val.num++;
            this.root.render();
        }
    }),
}
window.app = new Colon({
    el: "#app",
    data:window.state,
    mounted(){
        window.setInterval(this.methods.updateTime,1000);
    },
    methods:{
        updateTime(){
            this.data.time = new Date().toLocaleString();
            this.render();
        },
    },
    components:{
        CounterComponent: Counter,
    },
    directives:{
        "^:md$": ({ $app, $value, $this }) => {
            var md = new markdownit();
            var newValue = $app.run($value);
            $this.innerHTML = md.render(newValue);
        }
    }
});