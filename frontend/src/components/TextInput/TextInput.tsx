import React, {useEffect, useRef, useState} from "react";
import styles from "./TextInput.module.css";
import {multipleStyles} from "utility";
import {RecipeState, UpdateState, StyleProps} from "types/types";

export type TextInputProps = {
    identifier: string,
    index?: number,
    placeholder: string
};

export interface TextInputCSS extends React.CSSProperties {
    '--font-size': string;
    '--font-weight': string;
    '--font-color': string;
    '--text-align': string;
    '--background-color': string;
    '--label-translate-y': string;
}


type AllTextInputProps = TextInputProps & UpdateState<RecipeState, 'setRecipe'> & StyleProps<TextInputCSS>;

function TextInput(props: AllTextInputProps) {

    const [isActive, setActive] = useState(false);
    const [isEmpty, setEmpty] = useState(true);

    /* Horizontal position of hint label on mobile devices must be calculated to be centered. */
    const [horizontalHintPos, setHorizontalHintPos] = useState(0);


    const inputRef = useRef<HTMLTextAreaElement>(null);
    const hintRef = useRef<HTMLLabelElement>(null);


    /* The scroll height approximates actual text height when set height is smaller.
     * So we set height to 0, and then to the scroll height.
     */
    const setToTextHeight = (element: HTMLTextAreaElement | null) => {
        if (element) {
            element.style.setProperty("height", "0");

            // Set minimum height to support one line.
            let scrollHeight = element.scrollHeight;
            if (scrollHeight < 29) {
                scrollHeight = 29;
            }
            element.style.setProperty("height", scrollHeight + "px");
        }
    };

    /* Set hint position to center of input field on mobile browsers. */
    const centerHintPosition = (input: HTMLTextAreaElement | null, hint: HTMLLabelElement | null) => {
        if (input && hint) {
            if (window.innerWidth <= 640) {
                const inputWidth = input.offsetWidth;
                const hintWidth = hint.offsetWidth;
                const hintPosition = Math.floor((inputWidth - hintWidth) / 2);
                hint.style.setProperty(
                    "transform",
                    `translate(${hintPosition}px, var(--label-translate-y, 2em))`
                );
                setHorizontalHintPos(hintPosition);
            }
            else {
                hint.style.removeProperty("transform");
            }
        }
    };


    /* Function is called when text changes in the input field. */
    const changeHandler = (element: HTMLTextAreaElement) => {
        /* Set state to empty when the input becomes empty. CSS styles change accordingly. */
        if ((element.value.length === 0) === (!isEmpty)) {
            setEmpty(!isEmpty);
        }

        /* Change input field height depending on the text. */
        setToTextHeight(element);

        /* The identifier and index props makes the state that correspond to the input field.
         * Identifier is the state attribute name, and index is used when attribute is an array
         * like steps.
         */
        props.setRecipe(prevState => {
            // Set key as a key of the type of state.
            const key = props.identifier as keyof typeof prevState;

            // Steps attribute is an array of string type.
            if (Array.isArray(prevState[key]) && props.index !== undefined
                && prevState[key].every(item => typeof item === 'string')) {
                const steps = prevState[key] as string[];
                steps[props.index] = element.value;
                return {...prevState, [key]: steps};

            // Other attributes are scalar.
            } else {
                return {...prevState, [key]: element.value};
            }
        });
    };


    /* Change input field height depending on the text when the page loads. */
    useEffect(() => {
        const inputElement = inputRef?.current;
        setToTextHeight(inputElement);
    }, [inputRef]);


    /* Set hint position when input field is active on mobile browsers. */
    useEffect(() => {
        const input = inputRef?.current;
        const hint = hintRef?.current;
        if (input && hint) {
            if (window.innerWidth <= 640) {
                if (isActive || !isEmpty) {
                    hint.style.setProperty("transform", "translate(0.5rem, 0.375rem)");
                }
                else {
                    hint.style.setProperty(
                        "transform",
                        `translate(${horizontalHintPos}px, var(--label-translate-y, 2em))`
                    );
                }
            }
            else {
                hint.style.removeProperty("transform");
            }

        }
    }, [isActive, isEmpty]);


    /* Set hint position to center of input field on mobile browsers. */
    useEffect(() => {
        const inputElement = inputRef?.current;
        const hintElement = hintRef?.current;
        centerHintPosition(inputElement, hintElement);
        window.addEventListener('resize',() => {
            centerHintPosition(inputElement, hintElement);
        });
    }, [])

    return (
        <div className={styles["container"]} style={props.styles}>
            <label className={multipleStyles(styles,
                [
                        "label",
                        isActive ? "active" : "",
                        isEmpty ? "empty" : "",
                    ])}
                   htmlFor={`input-${props.identifier}`} ref={hintRef}>
                {props.placeholder}
            </label>

            <div className={multipleStyles(styles,
                [
                    "text-container",
                    isActive ? "active" : ""
                ])}>

                <textarea id={`input-${props.identifier}`} className={styles["input"]}
                          aria-invalid="false" ref={inputRef}
                          onFocus={() => setActive(true)}
                          onBlur={() => setActive(false)}
                          onChange={(e) => changeHandler(e.target)}
                />
                <textarea className={multipleStyles(styles, ["input", "structure"])}
                          aria-hidden="true" readOnly tabIndex={-1} />
            </div>
        </div>
    );
}

export default TextInput;