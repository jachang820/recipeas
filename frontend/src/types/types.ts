import React from "react";

/* Generic type that represents the setState function of type T.
 * K is the property name to be used.
 *
 * For example, if we have a state
 *     const [state, setState] = useState<T>(value);
 *
 * We want to use setState as a prop, but rename it to something that's relevant
 * to the component.
 *     export function Component({ K }: SomeType => { ... };
 *
 */
export type UpdateState<T, K extends string> =
    Record<K, React.Dispatch<React.SetStateAction<T>>>;

/* The state used for the function updateState that updates recipe action and ID
 * in tandem.
 */
export type UpdateRecipeState = {
    updateState: (recipeAction: RecipeAction, recipeId: RecipeId | null) => void
};

/* A type with a property named 'styles' that is an object with CSS variables. */
export type StyleProps<T extends React.CSSProperties> =
    Partial<Record<'styles', T>>;

/* A type that represents all strings of a certain length N. */
type FixedLengthString<N extends number> = string & {length: N};

/* Recipe ID is a hex string with 14 digits: 8 from the timestamp,
 * and a 6 digit ID.
 */
export type RecipeId =FixedLengthString<14>;

/* The potential actions that can be taken, emulates an enum. */
export type RecipeAction = "none" | "read" | "add" | "update" | null;

/* The type representing the subset of state properties used in the summary. */
export type RecipeSummaryState = {
    id: RecipeId | null,
    title: string,
    description: string,
    mimeType?: "image/jpeg" | "image/png" | "image/webp",
    thumbnailUrl?: string
};

/* The header uses the larger image instead of the thumbnail, so this type is
 * a superset of the recipe summary.
 */
export type RecipeHeaderState = RecipeSummaryState & {
    imageUrl?: string
};

/* The type representing the complete recipe state. */
export type RecipeState = RecipeHeaderState & {
    steps: string[]
};

/* Some useful image properties that are calculated after FilePond processes
 * images that are loaded.
 */
export type ImageProperties = {
    blob: Blob,
    size: number,
    md5: string
};

/* This state is used to load images from FilePond. FilePond has the option to
 * resize loaded images into multiple sizes, so to reduce file size and provide
 * a thumbnail.
 */
export type RecipeImages = {
    image: ImageProperties | null,
    thumbnail: ImageProperties | null
};