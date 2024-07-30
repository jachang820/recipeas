import React, {PropsWithChildren, useEffect, useRef} from 'react';
import style from './Toast.module.css';
import {UpdateState} from 'types/types';

type ToastProps = {
    trigger: boolean,
    milliseconds: number
} & UpdateState<boolean, 'setTrigger'> & PropsWithChildren;


function Toast({trigger, setTrigger, milliseconds, children}: ToastProps) {

    const toastRef = useRef<HTMLDivElement>(null);

    /* When triggered, show toast for 'milliseconds' with a half second delay. */
    useEffect(() => {
        if (trigger) {
            // Give a slight delay before showing to make transition effect better.
            setTimeout(() => {
                toastRef?.current?.style.setProperty("opacity", "1");
            }, 500);

            setTimeout(() => {
                toastRef?.current?.style.setProperty("opacity", "0");
                setTrigger(false);
            }, milliseconds + 500);
        }
    }, [trigger])

    return (
        <div className={style["toast"]} ref={toastRef}>
            {children}
        </div>
    );
}

export default Toast;