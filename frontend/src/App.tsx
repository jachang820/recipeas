import React, {useEffect, useState} from 'react'
import slugify from 'slugify';
import './App.css'
import NavBar from 'components/NavBar/NavBar';
import SummaryCard from 'components/SummaryCard/SummaryCard';
import Footer from 'components/Footer/Footer';
import {RecipeState, RecipeId, RecipeAction, RecipeImages} from "types/types.js";
import {blankRecipe, blankImages} from "utility";

import RecipeDetail from 'components/RecipeDetail/RecipeDetail';
import Overlay from 'components/Overlay/Overlay';
import Toast from 'components/Toast/Toast';

// These types refer to lists of existing recipes from the database,
// so they should always have a recipe id. RecipeHash is used to query
// recipes from the RecipeIndex.
type RecipeHash = (
    {[key: RecipeId]: RecipeState}
);

type RecipeList = {
    recipes: RecipeState[],
    lastKey: RecipeId
};

const apiGet = import.meta.env.VITE_GET_RECIPES_URL;


function App() {

    /* Used so that Overlay can determine visibility. */
    const [open, setOpen] = useState(false);

    /* The active recipe corresponds with the recipe action to determine what should be shown.
     * For the "read" action, it takes on one of the recipes from the RecipeHash that is retrieved from the API/GET.
     * For the "add" action, it takes on the blank recipe template above, so that it could be filled out.
     * For the "update" action, it takes on the newly submitted action returned from the API/POST.
     */
    const [activeRecipe, setRecipe] = useState<RecipeState>(blankRecipe);
    const [recipeAction, setRecipeAction] = useState<RecipeAction>(null);

    /* Recipe images are only relevant with the "add" action, and are used to store loaded blobs. */
    const [activeRecipeImages, setActiveRecipeImages] = useState<RecipeImages>(blankImages);

    /* The active recipe ID is used so that components could relay what the main app should show.
     * setActiveRecipeId and setRecipeAction are passed to each component, and then the main apps uses
     * useEffects to pull the relevant recipe from either blankRecipe or the recipe hash.
     */
    const [activeRecipeId, setActiveRecipeId] = useState<RecipeId | null>(null);

    /* A list of recipe states is returned from API/GET, then mapped to a hash of recipes with the ID as key.
     * The ID ias a timestamp and salt encoded in hex. The hash allows look up of each recipe.
     */
    const [recipeHash, setRecipeHash] = useState<RecipeHash>({});

    /* The recipe index is a list of recipe IDs in their order of appearance (descending timestamp).
     */
    const [recipeIndex, setRecipeIndex] = useState<RecipeId[]>([]);

    /* DynamoDB query API returns a LastExclusiveKey if there are further recipes after the specified limit is reached.
     * This key should be passed to the next query to get the next set of paginated recipes.
     */
    const [lastKey, setLastKey] = useState<RecipeId | undefined>(undefined);

    /* Trigger a toast message when a recipe successfully uploads. */
    const [triggerToast, setTriggerToast] = useState<boolean>(false);


    /* Make sure state updates are passed in the correct order by components.
     * Since useEffect is dependent on recipe action, the ID needs to be set first.
     * Pass this function to relevant components as needed.
     */
    const setRecipeState = (recipeAction: RecipeAction, recipeId: RecipeId | null) => {
        setActiveRecipeId(recipeId);
        setRecipeAction(recipeAction);
    };


    /* Fetch page of (5) recipe results from API. Then set RecipeList, reindex recipes,
     * and new last key if it exists.
     */
    const fetchBatchOfRecipes = () => {
        // Start querying from LastExclusiveKey if it exists.
        let queryString = '';
        if (lastKey) {
            queryString = `?lastKey=${lastKey}`;
        }

        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "max-age=180"
            }
        };

        fetch(apiGet + queryString, options)
            .then(res => res.json())
            .then((data: RecipeList) => {
                const recipes = data["recipes"];

                recipes.forEach((recipe) => {
                    if (recipe.id && !(recipe.id in recipeHash)) {
                        setRecipeHash((prevHash) => (
                            {...prevHash, [recipe.id!]: recipe}));
                        setRecipeIndex((prevList) => [...prevList, recipe.id!])
                    }
                })

                if ("lastKey" in data) {
                    setLastKey(data["lastKey"]);
                }
            });
    };


    let count = 0; // Prevent the effects of mounting twice (strict mode).
    useEffect(() => {
        if (count == 0) {
            /* Make a GET request to API to retrieve a paginated list of recipes. */
            fetchBatchOfRecipes();

            // Set behavior for browser back button
            window.onpopstate = () => {
                setRecipe(blankRecipe);
                setOpen(false);
                setRecipeState(null, null);
            };

            count++;
        }
    }, []);


    /* Set the active recipe and toggle Overlay in response to new recipe action and ID. */
    useEffect(() => {
        if (recipeAction === "none") {
            // When close button pressed, close overlay and return state back to blank recipe.
            setRecipe(blankRecipe);
            setOpen(false);
            history.back();
        }
        else if (recipeAction === "add") {
            // Add button is only accessible in closed state, so recipe should already be blank.
            // So the only thing that needs to be done is open the Overlay.
            setOpen(true);
            history.pushState({}, "Add recipe", "add-recipe");
        }
        else if (recipeAction == "read") {
            if (activeRecipeId && activeRecipeId in recipeHash) {
                // Use active id to retrieve the correct index from the recipe list.
                const activeRecipe = recipeHash[activeRecipeId];
                setRecipe(activeRecipe);

                // Open the details overlay.
                setOpen(true);
                history.pushState({}, "Read recipe", slugify(activeRecipe.title));
            }
        }
        else if (recipeAction == "update") {
            // Make sure new recipe ID is valid and not overlapped.
            if (activeRecipe.id && !(activeRecipe.id in recipeHash)) {
                // Prepend recipe list with new recipe, so it shows up at the top.
                setRecipeHash((prevHash) =>
                    ({[activeRecipe.id!]: activeRecipe, ...prevHash})
                );
                setRecipeIndex((prevList) => [activeRecipe.id!, ...prevList]);

                // Clear active recipe before closing details overlay after new recipe has been submitted.
                setRecipeState("none", null);

                // Show toast to notify user of success.
                setTriggerToast(true);
            }
        }
    }, [recipeAction]);


    /* Disable button for 3 seconds while next batch is fetched. */
    const handleNextPage = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const element = event?.currentTarget;
        if (element) {
            element.style.setProperty("visibility", "hidden");
            fetchBatchOfRecipes();
            setTimeout(() => {
                element.style.setProperty("visibility", "visible");
            }, 3000);
        }
    };


    return (
        <>
            <div className="app-content">
                <NavBar buttonText="Add recipe" isOpen={open}
                        updateState={setRecipeState}>
                    <span className="logo-text">Reci</span>
                    <img className="logo" src="/pea.png" alt="Site logo" />
                </NavBar>

                {recipeIndex.map((recipeId) => {
                    const recipe = recipeHash[recipeId];
                    return (
                        <SummaryCard key={recipe.id} id={recipe.id}
                                     title={recipe.title} thumbnailUrl={recipe.thumbnailUrl}
                                     updateState={setRecipeState}>
                            {recipe.description}
                        </SummaryCard>
                    );
                })}

                {/* If paginated data still exists, fetch next batch. */}
                {lastKey &&
                    <div className="next-page" onClick={handleNextPage}>
                        <svg className="next-page-icon" role="presentation" aria-hidden="true" viewBox="-75 -43 600 600"
                             xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"/>
                        </svg>
                    </div>
                }

            </div>

            <Footer>© 2024 Jonathan Chang</Footer>
            <Overlay isOpen={open} action={recipeAction}
                     footerText="© 2024 Jonathan Chang">
                <RecipeDetail recipe={activeRecipe}
                              recipeImages={activeRecipeImages}
                              action={recipeAction}
                              setRecipe={setRecipe}
                              setRecipeImages={setActiveRecipeImages}
                              updateState={setRecipeState}
                />
            </Overlay>
            <Toast trigger={triggerToast}
                   setTrigger={setTriggerToast}
                   milliseconds={2500}>
                Your recipe has been saved.<br/>Thank you for your contribution!
            </Toast>
        </>
    );
}

export default App;
