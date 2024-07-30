import React, {CSSProperties, PropsWithChildren} from "react";
import styles from "./RecipeStep.module.css";
import {UpdateState, RecipeState, RecipeAction} from "types/types";
import TextInput from "components/TextInput/TextInput";

export type StepProps = {
    action: RecipeAction,
    n: number
} & PropsWithChildren & UpdateState<RecipeState, 'setRecipe'>;

interface RecipeStepCSS {
    '--step-font-size': string;
    '--step-font-weight': string;
    '--step-font-color': string;
    '--step-background-color': string;
}


function RecipeStep(steps: StepProps) {

    const editMode = steps.action === "add";

    const instruction = steps.children?.toString() ?? '';

    const stepStyles: RecipeStepCSS & CSSProperties = {
        '--step-font-size': '1.1em',
        '--step-font-weight': '400',
        '--step-font-color': 'rgb(71 85 105)',
        '--step-background-color': '#f9f9f9',
    };

    return (
        <article className={styles["step"]} style={stepStyles}>
            <div className={styles["numbering-container"]}>
                <div className={styles["line"]}/>
                <div className={styles["numbering"]}>
                    {steps.n + 1}
                </div>
            </div>
            <div className={styles["content"]}>
                {editMode &&
                    <TextInput identifier="steps"
                               index={steps.n}
                               placeholder={`Instructions for step ${steps.n + 1}`}
                               setRecipe={steps.setRecipe}
                               styles={{
                                   '--font-size': 'var(--step-font-size)',
                                   '--font-weight': 'var(--step-font-weight)',
                                   '--font-color': 'var(--step-font-color)',
                                   '--text-align': 'left',
                                   '--background-color': 'var(--step-background-color)',
                                   '--label-translate-y': '2em'
                               }}
                    />
                }
                {!editMode && <p className={styles["text"]}>{instruction}</p>}
            </div>
        </article>
);
}

export default RecipeStep;