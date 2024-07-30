import React, {CSSProperties} from "react";
import styles from "./RecipeHeader.module.css";
import {UpdateState, RecipeHeaderState, RecipeState, RecipeAction, RecipeImages} from "types/types";
import {imageOrDefault, multipleStyles, RenameKeyToChildren} from "utility";
import TextInput from 'components/TextInput/TextInput';
import ImageUpload from "components/RecipeDetail/ImageUpload/ImageUpload";

type RecipeHeaderProps = { 'action': RecipeAction }
    & RenameKeyToChildren<RecipeHeaderState, 'description'>
    & UpdateState<RecipeState, 'setRecipe'>
    & UpdateState<RecipeImages, 'setRecipeImages'>;

type ViewContentProps = {
    title: string,
    children: string
};

interface RecipeHeaderCSS {
    '--title-font-size': string;
    '--title-font-weight': string;
    '--description-font-size': string;
    '--description-font-weight': string;
    '--header-font-color': string;
    '--header-background-color': string;
    '--header-text-align': string;
}


function RecipeHeader(recipe: RecipeHeaderProps) {

    const addingRecipe = recipe.action === "add";
    const imageUrl = imageOrDefault(recipe.imageUrl);

    const headerStyles: RecipeHeaderCSS & CSSProperties = {
        '--title-font-size': '2.8em',
        '--title-font-weight': '600',
        '--description-font-size': '1.125rem',
        '--description-font-weight': '400',
        '--header-font-color': 'rgb(255 255 255 / 0.87)',
        '--header-background-color': 'rgb(66 97 125 / 0.75)',
        '--header-text-align': 'center'
    };

    return (

        <header className={styles["header"]} style={headerStyles}>
            <div className={multipleStyles(styles, ["line", "first-line"])}/>
            <div className={multipleStyles(styles, ["line", "second-line"])}/>
            <div className={styles["image-container"]}>
                {addingRecipe &&
                    <ImageUpload setRecipe={recipe.setRecipe} setRecipeImages={recipe.setRecipeImages} />}
                { !addingRecipe && <img className={styles["image"]} src={imageUrl} alt={recipe.title}/>}
            </div>
            <div className={styles["content"]}>
                {addingRecipe && <EditContent setRecipe={recipe.setRecipe}/>}
                {!addingRecipe && <ViewContent title={recipe.title}>{recipe.children}</ViewContent>}
            </div>
        </header>
    );
}

function ViewContent({title, children}: ViewContentProps) {
    return (
        <>
            <h1 className={styles["title"]}>{title}</h1>
            <p className={styles["description"]}>{children}</p>
        </>
    );
}

function EditContent({setRecipe}: UpdateState<RecipeState, 'setRecipe'>) {
    return (
        <>
            <TextInput identifier="title"
                       placeholder="Recipe Title"
                       setRecipe={setRecipe}
                       styles={{
                           '--font-size': 'var(--title-font-size)',
                           '--font-weight': 'var(--title-font-weight)',
                           '--font-color': 'var(--header-font-color)',
                           '--text-align': 'var(--header-text-align)',
                           '--background-color': 'var(--header-background-color)',
                           '--label-translate-y': '0.8em',
                       }}
            />
            <TextInput identifier="description"
                       placeholder="Recipe Description"
                       setRecipe={setRecipe}
                       styles={{
                           '--font-size': 'var(--description-font-size)',
                           '--font-weight': 'var(--description-font-weight)',
                           '--font-color': 'var(--header-font-color)',
                           '--text-align': 'var(--header-text-align)',
                           '--background-color': 'var(--header-background-color)',
                           '--label-translate-y': '2em'
                       }}
            />
        </>
    );
}

export default RecipeHeader;