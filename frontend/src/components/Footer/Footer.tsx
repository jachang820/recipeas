import React, {PropsWithChildren} from "react";
import styles from "./Footer.module.css";

function Footer({ children }: PropsWithChildren) {

    return (
        <>
            <footer>
                <div className={styles["text"]}>
                    {children}
                </div>
            </footer>
        </>

    )
}

export default Footer;