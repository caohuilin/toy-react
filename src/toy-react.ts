
const RENDER_TO_DOM = Symbol('render_to_dom')

declare global {
    namespace JSX {
        interface IntrinsicElements extends Component<any, any> {
            button: any
            div: any
            span: any
            ol: any
            li: any

        }
    }
}

export abstract class Component<P = any, S = {}> {
    props: P = Object.create(null)
    children: (Component | ElementWrapper | TextWrapper)[] = []
    _root: null = null
    _range: Range | null = null
    state: S = {} as S

    abstract render(): Component

    setAttribute(key: string, value: any) {
        const props = this.props as { [key: string]: any }
        props[key] = value
    }
    appendChild(component: Component | ElementWrapper | TextWrapper) {
        this.children.push(component)
    }

    [RENDER_TO_DOM](range: Range) {
        this._range = range
        this.render()[RENDER_TO_DOM](range)
    }

    rerender() {
        const oldRange = this._range
        if (oldRange) {
            const range = document.createRange()
            range.setStart(oldRange.startContainer, oldRange.startOffset)
            range.setEnd(oldRange.startContainer, oldRange.startOffset)
            this[RENDER_TO_DOM](range)

            oldRange.setStart(range.endContainer, range.endOffset)
            oldRange.deleteContents()
        }
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
        if (key === 'className') {
            this.root.setAttribute('class', value)
        } else if (key.match(/^on([\s\S]+)/)) {
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
        } else {
            this.root.setAttribute(key, value)
        }
    }
    appendChild(component: Component | ElementWrapper | TextWrapper) {
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

export function createElement(type: (new () => Component) | (() => Component) | string, attrs: { [key: string]: any }, ...children: (Component | string | number | null)[]) {
    let element: Component | ElementWrapper
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
    const insertChild = (children: (Component | TextWrapper | string | number | null)[]) => {
        for (let child of children) {
            if (child === null) {
                continue
            }
            if (typeof child === 'string' || typeof child === 'number') {
                child = new TextWrapper(child.toString())
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
    component[RENDER_TO_DOM](range)
}