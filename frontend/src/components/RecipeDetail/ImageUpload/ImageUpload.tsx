import React, {useEffect, useRef, useState} from "react";
import  "./ImageUpload.css";
import {RecipeImages, RecipeState, UpdateState} from "types/types";
import {blankImages} from "utility";
import {md5} from "js-md5";

import {FilePond, registerPlugin} from "react-filepond";
import 'filepond/dist/filepond.min.css';

import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImageResize from 'filepond-plugin-image-resize';
import FilePondPluginImageTransform from 'filepond-plugin-image-transform'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import {FilePondFile} from "filepond";

/* FilePond plugins expose more props to the component that grant additional
 * capabilities.
 */
registerPlugin(FilePondPluginImagePreview);
registerPlugin(FilePondPluginFileValidateType);
registerPlugin(FilePondPluginFileValidateSize);
registerPlugin(FilePondPluginImageResize); // Resize is needed for Transform to work
registerPlugin(FilePondPluginImageTransform);

type ImageUploadProps = UpdateState<RecipeState, 'setRecipe'>
    & UpdateState<RecipeImages, 'setRecipeImages'>;

/* Used for FilePond to transform/resize loaded files. */
type FilePondTransform = {
    resize: {
        size: {
            width: number,
            height: number
        }
    }
};

/* FilePond processed file format. */
type BlobWithName = {
    file: Blob,
    name: string
};

function ImageUpload({setRecipe, setRecipeImages}: ImageUploadProps) {

    const [images, setImages] = useState<Blob[]>([])

    const uploadRef = useRef<HTMLDivElement>(null);
    const filePondRef = useRef<FilePond>(null);

    /* Set styles when FilePond element is in focus or on mouse hover. */
    const focusUpload = () => {
        if (uploadRef?.current) {
            const svgElement: Element = uploadRef.current.getElementsByClassName("upload-icon")[0];
            (svgElement as SVGElement).style.setProperty("fill", "rgb(66 97 125)");
            (svgElement as SVGElement).style.setProperty("transform", "scale(1.1)");
        }

    };

    /* Set styles when Filepond element loses focus or on mouse out. */
    const blurUpload = () => {
        if (uploadRef?.current) {
            const svgElement: Element = uploadRef.current.getElementsByClassName("upload-icon")[0];
            (svgElement as SVGElement).style.setProperty("fill", "rgb(66 97 125 / 0.5)");
            (svgElement as SVGElement).style.setProperty("transform", "scale(1)");
        }
    };

    /* Disable file browser after a file has been loaded to force file removal before reloading. */
    const setBrowserVisibility = (visible: boolean) => {
        const value = visible ? "visible" : "hidden";
        if (uploadRef?.current) {
            const inputElement: Element = uploadRef.current.getElementsByClassName("filepond--browser")[0];
            (inputElement as HTMLInputElement).style.setProperty('visibility', value);
        }
    };

    /* Update app state based on local state changes in reaction to image upload or removal. */
    const addImageState = (field: "image" | "thumbnail") => {
        const blob = field === "image" ? images[0] : images[1];
        let mimeType: "image/png" | "image/jpeg" | "image/webp";

        /* Read blob stream into Uint8 byte array. */
        blob.stream().getReader().read().then(({value}) => {
            /* Decode array into ascii, since utf-8 changes some bytes when invalid byte
             * sequences are encountered. For example, the jpg magic number \uFFD8 is
             * an invalid utf-8 character and would be changed to \uFFFD, where as ascii
             * consistently renders it as ÿØ. Ascii renders \uFFFE as ÿÙ. These are the
             * first two and last two bytes of a jpg file.
             */
            const text = new TextDecoder('ascii').decode(value);
            let isValid = true;

            /* Find consistencies in image headers to determine MIME type.
             * FilePond only looks at file extension, which is less reliable.
             */
            if (text.slice(1, 4) === "PNG") {
                mimeType = "image/png";
            }
            else if (
                (text.slice(6, 10) === "JFIF" || text.slice(6, 10) === "EXIF") &&
                text.slice(0, 3) === "ÿØÿ" && text.slice(-2) === "ÿÙ"
            ) {
                mimeType = "image/jpeg";
            }
            else if (text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP") {
                mimeType = "image/webp";
            }
            else {
                // Only allow webp, jpg and png formats.
                isValid = false;
            }

            if (isValid) {
                setRecipe(prevState => (
                    {...prevState, mimeType: mimeType}
                ));

                // Update "image" or "thumbnail" fields with metadata.
                setRecipeImages(prevState => (
                    {...prevState, [field]: {
                            blob: blob,
                            size: blob.size,
                            md5: md5.base64(value!)
                        }
                    }
                ));
            }
            else {
                /* Remove files from FilePond if they're found to be of
                 * invalid type.
                 */
                filePondRef?.current?.removeFiles();
            }
        });

        // blobToBase64(blob, (result) => {
        //     setRecipeImages(prevState => (
        //         {...prevState, mimeType: mimeType, [field]: result}
        //     ));
        // });

    };

    /* Add image data and MIME types. */
    const setImageState = () => {
        addImageState("image");
        addImageState("thumbnail");
    };

    /* Reset default MIME type and clear image data. */
    const removeImageState = () => {
        setRecipe(prevState => (
            {...prevState, mimeType: "image/png"}
        ));
        setRecipeImages(() => blankImages);
    };

    /* When both image and thumbnail has been detected in local image state,
     * process the app recipe state. If an image is removed, clear app state.
     */
    useEffect(() => {
        if (images.length === 2) {
            setImageState();
        } else {
            removeImageState();
        }

    }, [images]);


    return (
        <>
            <div className="image-upload-container" ref={uploadRef}
                onMouseOver={focusUpload} onMouseOut={blurUpload}
                onFocus={focusUpload} onBlur={blurUpload}>
                <FilePond
                    ref={filePondRef}
                    allowPaste={false}
                    storeAsFile={true}
                    maxFiles={1}
                    credits={false}
                    instantUpload={false}
                    onaddfilestart={() => setBrowserVisibility(false)}
                    onpreparefile={(fileItem: FilePondFile, output: BlobWithName[]) => {
                        setImages(output.map((obj) => obj.file));
                    }}
                    onremovefile={() => {
                        setBrowserVisibility(true);
                        setImages([]);
                    }}
                    labelIdle="
                    <svg class='upload-icon' role='presentation' aria-hidden='true' viewBox='0 0 24 24' fill='currentColor' width='50px' height='50px'>
                        <path fill='none' d='M0 0h24v24H0z'/>
                        <path
                            d='M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zM7 9l1.41 1.41L11 7.83V16h2V7.83l2.59 2.58L17 9l-5-5-5 5z'/>
                    </svg><br />Upload picture<br />(Not compatible with Safari)"
                    dropOnElement
                    dropValidation
                    acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
                    maxFileSize="1MB"
                    imageTransformClientTransforms={["resize"]}
                    imageResizeMode="contain"
                    imageResizeTargetWidth={640}
                    imageResizeTargetHeight={1200}
                    imageTransformVariantsDefaultName="large"
                    imageTransformOutputQuality={80}
                    imageResizeUpscale={false}
                    imageTransformVariants={{
                        small: (transforms: FilePondTransform) => {
                            transforms.resize = {
                                size: {
                                    width: 360,
                                    height: 600
                                }
                            };
                            return transforms;
                        }
                    }}
                />
            </div>

        </>
    );
}

export default ImageUpload;