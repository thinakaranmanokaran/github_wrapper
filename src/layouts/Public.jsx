import { Header } from '../components';
import { Outlet } from 'react-router-dom';
import Footer from '../components/public/Footer';

const Public = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            {/* Page Content */}
            <main className="flex-1 pb-12">
                <Outlet />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Public;
