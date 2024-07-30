import React, {useRef} from "react";
import styles from "./SummaryCard.module.css";
import type {
    RecipeSummaryState,
    UpdateRecipeState
} from "types/types";
import {imageOrDefault, RenameKeyToChildren} from "utility";

// Types to organize component props.
type RecipeSummary = RenameKeyToChildren<RecipeSummaryState, 'description'>;
type SummaryProps = RecipeSummary & UpdateRecipeState;

// Type for dealing with mouse clicks on multiple element types.
type SummaryMouseEvent = React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>;

function SummaryCard(recipe: SummaryProps) {

    const buttonRef = useRef<HTMLButtonElement>(null);

    /* Use default image if thumbnail doesn't exist. */
    const imageUrl = imageOrDefault(recipe.thumbnailUrl);

    /* When summary is clicked, pass its recipe ID to state so that the details could be shown. */
    const setActiveId = (event: SummaryMouseEvent) => {
        const cardIsClicked = (event.target as HTMLElement)?.tagName !== "BUTTON";
        const buttonIsVisible =
            buttonRef?.current?.checkVisibility();

        // On desktop, card is clickable and button is invisible.
        const cardIsActive = cardIsClicked && !buttonIsVisible;

        // On mobile, card is not clickable and button is visible.
        const buttonIsActive = !cardIsClicked && buttonIsVisible;

        // Set the active recipe id when element is clicked when they are clickable.
        if (cardIsActive || buttonIsActive) {
            recipe.updateState("read", recipe.id);
        }
    };

    return (
        <div className={styles["summary"]} onClick={setActiveId}>
            <div className={styles["image-container"]}>
                <img className={styles["image"]} src={imageUrl} alt={recipe.title}/>
            </div>
            <div className={styles["content"]}>
            <div className={styles["text"]}>
                    <h2 className={styles["title"]}>{recipe.title}</h2>
                    <p className={styles["description"]}>{recipe.children}</p>
                </div>
                <div className={styles["fadeout"]}/>
            </div>
            <button className={styles["button"]} type="button" ref={buttonRef} onClick={setActiveId}>
                View recipe
            </button>
        </div>
    );
}

export default SummaryCard;