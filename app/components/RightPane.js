const RightPane = ({ view }) => {
    // Determine what content to display based on the view
    const iframeSrc = () => {
        switch (view) {
            case 'settings':
                return 'https://example.com/settings'; // Replace with the actual Boat settings URL
            case 'navigation':
                return 'https://demo.signalk.org/@signalk/freeboard-sk/';
            case 'manual':
                return 'https://example.com/boat-manual.pdf'; // Replace with your boat manual PDF viewer
            case 'instrument':
                return 'https://demo.signalk.org/@mxtommy/kip/#/page/0';
            case 'netflix':
                return 'https://www.netflix.com';
            case 'webcam1':
                return 'https://pv.viewsurf.com/2080/Chatelaillon-Port?i=NzU4Mjp1bmRlZmluZWQ';
            case 'webcam2':
                return 'https://pv.viewsurf.com/1478/Chatelaillon-Plage&lt?i=NTkyMDp1bmRlZmluZWQ';
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col w-full h-full"> {/* Use flex for layout */}
            {iframeSrc() ? (
                <iframe
                    className="flex-grow border-none"
                    src={iframeSrc()} // Load dynamic content based on the selected view
                    title="External Application"
                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-white">Select an app to display in this pane</p>
                </div>
            )}
        </div>
    );
};

export default RightPane;
