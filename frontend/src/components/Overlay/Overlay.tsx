import React, {PropsWithChildren, useEffect, useRef} from "react";
import styles from "./Overlay.module.css";
import {RecipeAction, StyleProps} from "types/types";
import Footer from "components/Footer/Footer";


export interface OverlayCSS extends React.CSSProperties {
    '--z-index': string;
    '--background-color': string;
}

type OverlayProps = {
    isOpen: boolean,
    action: RecipeAction,
    footerText: string
} & PropsWithChildren & StyleProps<OverlayCSS>;

function Overlay({isOpen, action, footerText, children, styles: style}: OverlayProps) {

    const overlayRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        /* Show overlay depending on the 'isOpen' state. */
        overlayRef?.current?.style.setProperty('visibility',
            isOpen ? 'visible' : 'hidden');

        /* Show different animation sequences upon opening, depending on whether a recipe is
         * being added.
         */
        if (isOpen) {
            if (action === "add") {
                /* Since Add Recipe button is at the top, transition animation slides down
                 * for editing new recipes.
                 */
                overlayRef?.current?.animate([
                    { marginTop: "-50vh", opacity: 0 },
                    { marginTop: "0", opacity: 1 }
                ], { duration: 300 });

            } else {
                /* A summary is clicked somewhere in the middle of the page, so transition
                 * animation for opening recipe details expands vertically from middle.
                 */
                overlayRef?.current?.animate([
                    { marginTop: "50vh", height: "0" },
                    { marginTop: "0", height: "100vh" }
                ], { duration: 400 });
            }

            /* Disable scrolling on original page while details/editing is open. */
            document.body.style.setProperty("overflow-y", "hidden");

        } else {
            /* Re-enable scrolling after closing overlay. */
            document.body.style.setProperty("overflow-y", "auto");
        }
    }, [isOpen])

    return (
        <div className={styles["overlay"]} style={style} ref={overlayRef}>
            <div className={styles["container"]}>
                {children}
            </div>
            <Footer>{footerText}</Footer>
        </div>
    );
}

export default Overlay;