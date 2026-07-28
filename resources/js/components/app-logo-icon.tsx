import type { SVGAttributes } from 'react';

import logo from '/public/images/full_logo2.png';

export default function AppLogoIcon(
    props: React.ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            src={logo}
            alt="LMIC Logo"
            {...props} // This lets you keep the className="h-10 w-auto" logic
        />
    );
}
