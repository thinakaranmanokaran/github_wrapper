import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Home } from '../pages'
import Public from '../layouts/Public'

const User = () => {
    return (
        <Routes>
            <Route element={<Public />}>
                <Route index element={<Home />} />
            </Route>
        </Routes>
    )
}

export default User