import React from 'react';
import { Header } from '../components';
import { Outlet } from 'react-router-dom';
import Footer from '../components/public/Footer';

const Public = () => {
    return (
        <div className=''>
            <Header />
            <Outlet />
            <Footer />
        </div>
    )
}

export default Public;
