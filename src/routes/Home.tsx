import { Container, useTheme, Typography, Button, Box } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react'
import PocketBaseContext from '../hooks/PocketbaseContext'
import { Record } from 'pocketbase'
import DirectoryTable from '../components/DirectoryTable'

export default function Home(props: {}) {
    const theme = useTheme()
    const client = useContext(PocketBaseContext)

    // const [user, setUser] = useState("")
    const [root, setRoot] = useState<Record|undefined>(undefined)

    useEffect(() => {
        // Check if user is logged in
        if(!client?.authStore.isValid) {
            window.location.href = '/login'
            return
        }

        // Get dir from url query
        const root = (new URL(window.location.href)).searchParams.get('dir')
        
        // setUser(client.authStore.model?.email)
        client.collection('directory').getFirstListItem("parent = null").then((record) => {
            setRoot(record)
        })
    }, [])

    function logout() {
        client?.authStore.clear()
        window.location.href = '/login'
    }

    return <Container>
        <Box sx={{
            mt: theme.spacing(4),
            display: 'flex',
            justifyContent: 'end'
        }}>

            <Button  variant="outlined" size='small' sx={{
                mr: theme.spacing(2)
            }}>Sync now</Button>
            <Button onClick={logout} variant="contained" size='small' LinkComponent="a" href="#">Logout</Button>
        </Box>
        <Box sx={{
            mt: theme.spacing(2)
        }}>
            {root ? 
        <DirectoryTable directoryId={root.id}/>
        :
        "Lade Daten ..."    
        }
        </Box>
    </Container>
}