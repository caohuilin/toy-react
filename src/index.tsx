import { createElement, render, Component } from './toy-react';

class MyComponent extends Component {
    render() {
        return (<div>
            <h1>myComponent</h1>
            {this.children}
        </div>)
    }
}

const MyFuncComponent = (props) => {
    return <div>
        <h1>MyFuncComponent</h1>
        {props.children}
    </div>
}

// render(<MyComponent id="my"><div>text1</div><div>text2</div></MyComponent>, document.body);
render(<MyFuncComponent id="my"><div>text1</div><div>text2</div><MyComponent /></MyFuncComponent>, document.body);