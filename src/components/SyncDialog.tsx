import React, { useState } from 'react'
import { Dialog, DialogContent, DialogContentText, DialogTitle, useTheme } from '@mui/material'
import SyncProgress from './SyncProgress'

export default function SyncDialog(props: {open: boolean, onFinished: (error?: string)=>void}) {
    const theme = useTheme()
    

    function handleClose(event: {}, reason: string) {
        if(reason && reason == "escapeKeyDown" || reason == "backDropClick") return
    }    

    return (
        <Dialog open={props.open} onClose={handleClose} onBackdropClick={() =>{}} disableEscapeKeyDown={true}>
          <DialogContent sx={{
            display: 'flex',
            justifyContent: 'center'
          }}>
                <SyncProgress onFinish={props.onFinished}/>         
          </DialogContent>
        </Dialog>
    )
}