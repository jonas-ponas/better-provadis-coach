import React from 'react'
import PocketBase from 'pocketbase';

const PocketBaseContext = React.createContext<null|PocketBase>(null);

export default PocketBaseContext;