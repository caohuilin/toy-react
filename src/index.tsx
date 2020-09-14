import { createElement, render, Component, SFC } from './toy-react';

import './style.less'

interface IMyComponentState {
    a: number
    b: {
        show: string
    }
}
class MyComponent extends Component<{}, IMyComponentState> {
    constructor() {
        super()
        this.state = {
            a: 1,
            b: {
                show: "string"
            }
        }
    }
    handleClick = () => {
        this.setState({a: this.state.a + 1})
    }

    render() {
        return (<div>
            <h1>myComponent</h1>
            <span>{this.state.a.toString()}</span>
            <span>{this.state.b.show.toString()}</span>
            <button onClick={this.handleClick}>add</button>
            {this.children}
        </div>)
    }
}


const MyFuncComponent: SFC<{ id: string }> = (props) => {
    return <div>
        <h1>MyFuncComponent</h1>
        {props.children}
    </div>
}

// render(<MyComponent id="my"><div>text1</div><div>text2</div></MyComponent>, document.body);
render(<MyFuncComponent id="my"><div>text1</div><div>text2</div><MyComponent /></MyFuncComponent>, document.body);