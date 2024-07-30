import React, {PropsWithChildren, useEffect, useRef} from "react";
import styles from "./NavBar.module.css";
import {multipleStyles} from "utility";
import {UpdateRecipeState} from "types/types";

type NavBarProps = {
    buttonText: string,
    isOpen: boolean
} & PropsWithChildren & UpdateRecipeState;


function NavBar({ buttonText, children, isOpen, updateState }: NavBarProps) {

    const addButtonRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    /* Set active recipe id to convey a new recipe is being added when a button is clicked. */
    const toggleOpen = () => {
        // Add recipe clicked, else close button clicked
        if (!isOpen) updateState("add", null);
        else updateState("none", null);
    };

    /* Show the appropriate button after the details overlay opens. */
    useEffect(() => {
        // Add recipe clicked
        if (isOpen) {
            addButtonRef?.current?.style.setProperty('visibility', 'hidden');
            closeButtonRef?.current?.style.setProperty('visibility', 'visible');

        // Close button clicked
        } else {
            addButtonRef?.current?.style.setProperty('visibility', 'visible');
            closeButtonRef?.current?.style.setProperty('visibility', 'hidden');
        }
    }, [isOpen])

    return (
        <>
            <div className={styles["spacing"]} />
            <nav>
                <div className={styles["logo"]}>
                    {children}
                </div>
                <button title="close" className={multipleStyles(styles, ["button", "close"])} tabIndex={0}
                    type="button" ref={closeButtonRef} onClick={toggleOpen} style={{visibility: 'hidden'}}>
                    <svg role="presentation" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path
                            d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"/>
                    </svg>
                </button>
                <button title="add" className={multipleStyles(styles, ["button", "add"])} tabIndex={0}
                    type="button" ref={addButtonRef} onClick={toggleOpen} style={{visibility: 'visible'}}>
                    <svg className={styles["icon"]} role="presentation" aria-hidden="true" viewBox="0 0 24 24"
                         xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>
                    </svg>
                    {buttonText}
                </button>
            </nav>
        </>
    );
}

export default NavBar;