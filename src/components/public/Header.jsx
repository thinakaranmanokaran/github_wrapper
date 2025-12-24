import React from 'react';
import images from '../../assets/images';

const Header = () => {
    return (
        <div className=" p-2 md:px-4 md:py-4">
            <div className='flex justify-between items-center'>
                <div className="flex items-center gap-1">
                    <img src={images.LightLogo} className='w-12 md:w-16' alt="Logo" />
                    <h1 className="text-2xl md:text-4xl font-clash tracking-tight">Github Wrapper</h1>
                </div>
                <div className="hidden md:flex items-center gap-4 font-general text-lg pr-4">
                    <a href="" className="">Github</a>
                    <a href="" className="">Developer</a>
                </div>
            </div>
            <div className="h-[1px] w-4/5 mx-auto bg-black/30 mt-2 md:mt-4"></div>
        </div>
    )
}

export default Header;
