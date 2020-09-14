
const RENDER_TO_DOM = Symbol('render_to_dom')

export abstract class Component<P = any, S = any> {
    props: P = Object.create(null)
    children = []
    _root: null
    _range: Range | null = null
    state: S

    abstract render()

    setAttribute(key: string, value: any) {
        this.props[key] = value
    }
    appendChild(component: Component) {
        this.children.push(component)
    }

    [RENDER_TO_DOM](range: Range) {
        this._range = range
        this.render()[RENDER_TO_DOM](range)
    }

    rerender() {
        this._range.deleteContents()
        this[RENDER_TO_DOM](this._range)
    }

    setState(newState: Partial<S>) {
        this.state = Object.assign({}, this.state || {}, newState) as S
        this.rerender()
    }
}

type PropsWithChildren<P> = P & { children?: Component };

interface FunctionComponent<P = {}> {
    (props: PropsWithChildren<P>, context?: any): Element | null;
}

export type SFC<P = {}> = FunctionComponent<P>;

class FuncComponent extends Component {
    func: (attrs: { [key: string]: any }) => Component
    constructor(func: () => Component) {
        super()
        this.func = func
    }
    render() {
        return this.func({ ...this.props, children: this.children })
    }
}

class ElementWrapper {
    root: HTMLElement
    constructor(type: string) {
        this.root = document.createElement(type)
    }
    setAttribute(key: string, value: any) {
        if (key.match(/^on([\s\S]+)/)) {
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
        }
        this.root.setAttribute(key, value)
    }
    appendChild(component: Component) {
        const range = document.createRange()
        range.setStart(this.root, this.root.childNodes.length)
        range.setEnd(this.root, this.root.childNodes.length)
        range.deleteContents()
        component[RENDER_TO_DOM](range)
    }
    [RENDER_TO_DOM](range: Range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}
class TextWrapper {
    root: Text
    constructor(content: string) {
        this.root = document.createTextNode(content)
    }
    [RENDER_TO_DOM](range: Range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

export function createElement(type: (new () => Component) | (() => Component) | string, attrs: { [key: string]: any }, ...children) {
    let element
    if (typeof type === 'string') {
        element = new ElementWrapper(type)
    } else if (type.prototype instanceof Component) {
        element = new (type as new () => Component)
    } else {
        element = new FuncComponent(type as (() => Component))
    }
    for (let attr in attrs) {
        element.setAttribute(attr, attrs[attr])
    }
    const insertChild = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            }
            if (Array.isArray(child)) {
                insertChild(child)
            } else {
                element.appendChild(child)
            }
        }
    }
    insertChild(children)
    return element
}
export function render(component: Component, parent: HTMLElement) {
    const range = document.createRange()
    range.setStart(parent, 0)
    range.setEnd(parent, parent.childNodes.length)
    range.deleteContents()
    component.render()[RENDER_TO_DOM](range)
}