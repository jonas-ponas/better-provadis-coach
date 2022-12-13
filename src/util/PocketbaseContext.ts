import React, { useContext } from 'react';
import PocketBase from 'pocketbase';

const PocketBaseContext = React.createContext<null | PocketBase>(null);

const usePocketbase = () => useContext(PocketBaseContext)

const PocketBaseProvider = PocketBaseContext.Provider

export {
    PocketBaseProvider,
    usePocketbase
};
