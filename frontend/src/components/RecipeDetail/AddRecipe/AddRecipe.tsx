import React, {useState} from "react";
import styles from "./AddRecipe.module.css";
import {RecipeImages, RecipeState, UpdateRecipeState, UpdateState} from "types/types";
import Toast from "components/Toast/Toast";

type PreSignedUrl = {
    url: string,
    fields: {
        [key: string]: string
    }
};

type RecipeResponse = {
    recipe: RecipeState,
    urls: {
        'image': PreSignedUrl,
        'thumbnail': PreSignedUrl
    }
};

type ErrorMessage = {
    errorMessage: string
};

type StateSetters = UpdateState<RecipeState, 'setRecipe'> & UpdateRecipeState;

type AddRecipeProps = {
    recipe: RecipeState,
    recipeImages: RecipeImages
} & StateSetters;

type UploadMeta = {
    imagesLoaded: boolean,
    imageFileSize?: number,
    imageMd5?: string,
    thumbnailFileSize?: number,
    thumbnailMd5?: string
};

type RecipeUpload = RecipeState & UploadMeta;

const apiPost = import.meta.env.VITE_POST_RECIPE_URL;


function AddRecipe({ recipe, recipeImages, setRecipe, updateState }: AddRecipeProps) {

    const [triggerToast, setTriggerToast] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");


    /* Add image metadata to the recipe object. */
    const recipeUpload: RecipeUpload = {...recipe, "imagesLoaded": false };
    if (recipeImages.image !== null && recipeImages.thumbnail !== null) {
        recipeUpload["imagesLoaded"] = true;

        recipeUpload["imageFileSize"] = recipeImages.image.size;
        recipeUpload["thumbnailFileSize"] = recipeImages.thumbnail.size;

        // This should always be true.
        if (recipeImages.image.md5 !== null && recipeImages.thumbnail.md5 !== null) {
            recipeUpload["imageMd5"] = recipeImages.image.md5;
            recipeUpload["thumbnailMd5"] = recipeImages.thumbnail.md5;
        }
    }

    /* Process presigned urls to produce form data that could be uploaded. */
    const processUrl = (blob: Blob, post: PreSignedUrl): [string, FormData] => {
        const url = post["url"];
        const fields = post["fields"];
        const formData = new FormData();
        Object.keys(fields).forEach((key) => {
            formData.append(key, fields[key]);
        });
        formData.append("file", blob);
        return [url, formData];
    };

    const defaultS3Callback = (xml: Response) => {
        console.log(xml);
    }

    /* Upload image using presigned url. */
    const postImageToS3 = (
        url: string, formData: FormData,
        callback: (xml: Response) => void = defaultS3Callback) => {

        fetch(url, {method: "POST", body: formData})
            .then(xml => callback(xml));
    };

    /* Request options for the initial POST to the API. */
    const requestOptions = {
        method: "POST",
        body: JSON.stringify(recipeUpload),
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-cache"
        }
    };

    /* Tests if response is valid. */
    const isObject = (data: unknown) => typeof data === "object" && data !== null;

    /* Disables button for 5 seconds after clicking. Uploads filled recipe. */
    const uploadRecipe = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const button = event?.currentTarget;

        if (button) {
            /* Hide button while processing. */
            button.style.setProperty("visibility", "hidden");

            /* POST request to API with new recipe state, aside from image data
             * in body.
             */
            fetch(apiPost, requestOptions)
                .then(res => res.json())
                .then((data: RecipeResponse | ErrorMessage) => {
                    /* Test if response is a valid object. */
                    if (isObject(data) && "recipe" in data) {
                        const recipe = data["recipe"];

                        /* Successfully added to database, so set recipe state
                         * so it could be prepended to the recipe list in the
                         * main page using the 'update' action.
                         */
                        setRecipe(recipe);

                        /* Presigned urls are generated if image meta were
                         * supplied to the API POST endpoint.
                         */
                        if ("urls" in data) {
                            /* Copy post fields to form data to be passed as
                             * headers to the S3 url. Make POST request to S3.
                             */
                            const imageBlob = recipeImages.image!.blob;
                            const imagePost = data["urls"]["image"];
                            const [imageUrl, imageForm] =
                                processUrl(imageBlob, imagePost);
                            postImageToS3(imageUrl, imageForm);

                            const thumbnailBlob = recipeImages.thumbnail!.blob;
                            const thumbnailPost = data["urls"]["thumbnail"];
                            const [thumbnailUrl, thumbnailForm] =
                                processUrl(thumbnailBlob, thumbnailPost);
                            postImageToS3(thumbnailUrl, thumbnailForm, () => {
                                /* Set the 'update' action only after thumbnail
                                 * has been posted to S3, so that the image could
                                 * be loaded.
                                 */
                                updateState("update", recipe.id);
                            });
                        }
                    }
                    else if (isObject(data) && "errorMessage" in data) {
                        /* An error has occurred. Show the error in a toast.
                         * There is no further error handling for now.
                         */
                        setErrorMessage(data["errorMessage"]);
                        setTriggerToast(true);
                    }
                    else {
                        /* This path is to cover all cases, but it really
                         * shouldn't ever hit.
                         */
                        setErrorMessage("Invalid request.");
                        setTriggerToast(true);
                    }

                });

            /* Since fetch is asynchronous, setTimeout should run in semi-
             * parallel. Wait 5 seconds before setting the submit button
             * back to being visible.
             */
            setTimeout(() => {
                button.style.setProperty("visibility", "visible");
            }, 5000);
        }
    };


    return (
        <>
            <button className={styles["submit"]} onClick={uploadRecipe}>
                Submit
            </button>

            <Toast trigger={triggerToast}
                   setTrigger={setTriggerToast}
                   milliseconds={2500}>
                <span className="warn">
                    {errorMessage}
                </span>
            </Toast>
        </>
    );
}

export default AddRecipe;