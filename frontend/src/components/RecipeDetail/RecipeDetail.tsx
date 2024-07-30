import React from "react";
import styles from "./RecipeDetail.module.css";
import {UpdateRecipeState, UpdateState, RecipeState, RecipeAction, RecipeImages} from "types/types";
import RecipeHeader from "components/RecipeDetail/RecipeHeader/RecipeHeader";
import RecipeStep from "components/RecipeDetail/RecipeStep/RecipeStep";
import AddRecipe from "components/RecipeDetail/AddRecipe/AddRecipe";

type StateSetters = UpdateState<RecipeState, 'setRecipe'>
    & UpdateState<RecipeImages, 'setRecipeImages'>
    & UpdateRecipeState;

export type DetailProps = {
    recipe: RecipeState,
    recipeImages: RecipeImages,
    action: RecipeAction
} & StateSetters;


function RecipeDetail({
                          recipe, recipeImages,
                          setRecipe, setRecipeImages, updateState,
                          action}: DetailProps) {

    /* Click handler for adding a step to the recipe that adjusts state accordingly. */
    const addStep = () => {
        setRecipe(prevState => {
            const steps = [...prevState['steps'], ''];
            return {...prevState, steps};
        });
    };

    /* Click handler for removing a step from the recipe that adjusts state accordingly. */
    const removeLastStep = () => {
        setRecipe(prevState => {
            const steps = prevState['steps'].slice(0, -1);
            return {...prevState, steps};
        });
    };

    /* Check if input fields should be displayed instead of a recipe. */
    const addingRecipe = action === "add";

    /* These functions attempt basic validation and show either warning messages
     * or a submission button.
     */
    const showWarning = (text: string) => (
        <div className={styles["warn"] + " warn"}>
            {text}
        </div>
    );

    /* Title and description are non-empty. */
    const headerFilledOut = (title: string, description: string) =>
        title.trim().length > 0 && description.trim().length > 0

    /* There are at least 3 steps in the instructions. */
    const minimumRecipeLength = (minStep = 3) =>
        recipe.steps.length >= minStep;

    /* Each of the steps is non-empty. */
    const stepsFilledOut = (steps: string[]): boolean =>
        steps.every(step => step.trim().length > 0);

    /* Show warning message if any validation step fails. Otherwise, show button. */
    const validateOrSubmit = () => {
        if (!headerFilledOut(recipe.title, recipe.description)) {
            return showWarning("Need a title and description to submit.");
        } else if (!minimumRecipeLength(3)) {
            return showWarning("Need at least three steps to submit.");
        } else if (!stepsFilledOut(recipe.steps)) {
            return showWarning("Instructions must not be empty to submit.");
        } else {
            return (
                <AddRecipe
                    recipe={recipe}
                    recipeImages={recipeImages}
                    setRecipe={setRecipe}
                    updateState={updateState}
                />
            );
        }
    };

    return (
        <article>
            <RecipeHeader
                id={recipe.id}
                title={recipe.title}
                imageUrl={recipe.imageUrl}
                action={action}
                setRecipe={setRecipe}
                setRecipeImages={setRecipeImages}>
                {recipe.description}
            </RecipeHeader>

            <section className={styles["subsection"]}>
                <h2 className={styles["subtitle"]}>Instructions</h2>
                {recipe.steps.map((step, i) =>
                    <RecipeStep
                        key={i}
                        action={action}
                        n={i}
                        setRecipe={setRecipe}>
                        {step}
                    </RecipeStep>
                )}
                <div className={styles["buttons"]}>
                    {addingRecipe && recipe.steps.length > 0 &&
                        <button className={styles["button"]}
                                type="button"
                                onClick={() => removeLastStep()}>
                            Remove last step
                        </button>
                    }
                    {addingRecipe &&
                        <button className={styles["button"]}
                                type="button"
                                onClick={() => addStep()}>
                            Add step
                        </button>
                    }
                </div>

                {/*Basic validation of recipe data.*/}
                {addingRecipe && validateOrSubmit()}

            </section>
        </article>
    )
}

export default RecipeDetail;