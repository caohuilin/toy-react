import { createElement, render, Component } from './toy-react';

class MyElement extends Component {
    render() {
        return (<div>
            <h1>myComponent</h1>
            {this.children}
        </div>)
    }
}
render(<MyElement id="my"><div>text1</div><div>text2</div></MyElement>, document.body);