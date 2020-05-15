export default function (element: any, props: Map<string, unknown>, name: any) {
    if (props.has(name)) {
        element.dispatchEvent(new CustomEvent(`${name}-changed`, {
            bubbles: false,
            composed: true,
            detail: {
                value: element[name],
            },
        }))
    }
}
