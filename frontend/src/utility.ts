import {RecipeImages, RecipeState} from "./types/types";

/* For CSS modules with local styles, a random sequence is added to each class.
 * Therefore, these class names must be pulled from the CSSProperties object from
 * import. e.g.
 *
 * import styles from "./(component).module.css;"
 * <div className={styles["(class)"]} />
 *
 * However, this makes using multiple classes wordy.
 */
export const multipleStyles = (
    styles: {[key: string]: string}, arr: string[]): string =>
    arr.map((item) => styles[item]).join(' ');

/* Show default recipe image if an image was not uploaded. */
export const imageOrDefault = (imageUrl?: string) => {
    return imageUrl ?? "/noimage.png";
};

/* Rename a key from a type to a new key. This is useful when using an attribute as
 * children, or to customize the name of a generic type.
 */
export type RenameKey<T, OldKey extends keyof T, NewKey extends string> =
    Omit<T, OldKey> & Record<NewKey, T[OldKey]>;

/* Rename key from a type to 'children', a shortcut. */
export type RenameKeyToChildren<T, OldKey extends keyof T> =
    Omit<T, OldKey> & Record<'children', T[OldKey]>;

/* Fastest way I found to convert blobs to base64 so that it could be passed as string
 * to POST requests.
 */
export const blobToBase64 = (blob: Blob, callback: (result: string | null) => void) => {
    const reader = new FileReader();
    reader.onloadend = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl === "string") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, base64] = dataUrl.split(',');
            callback(base64);
        }
        else {
            callback(null);
        }
    }
    reader.readAsDataURL(blob);
};

/* Similarly as above, convert blogs to ArrayBuffers that could be used to pass into
 * other functions, e.g. to calculate an MD5 hash. With the FilePond library, this is
 * unnecessary, since the blobs come with their own arrayBuffer method.
 */
export const blobToArrayBuffer = (blob: Blob, callback: (result: ArrayBuffer | null) => void) => {
    const reader = new FileReader();
    reader.onloadend = (event) => {
        const buffer = event.target?.result;
        if (buffer && buffer instanceof ArrayBuffer) {
            callback(buffer);
        }
        else {
            callback(null)
        }
    }
    reader.readAsArrayBuffer(blob);
};

/* Blank recipe state, useful when we need to reset to a default state.
 * Default MIME type is based on the default image /noimage.png.
 */
export const blankRecipe: RecipeState = {
    id: null,
    title: "",
    description: "",
    mimeType: "image/png",
    steps: []
};

/* Blank recipe image state, useful when we need to reset to a default state. */
export const blankImages: RecipeImages = {
    image: null,
    thumbnail: null
};