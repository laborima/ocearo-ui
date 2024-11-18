import PDFList from "./docviewer/PDFList";

const RightPane = ({ view }) => {
    // Determine what content to display based on the view
    const iframeSrc = () => {
        switch (view) {
            case 'settings':
                return 'https://example.com/settings'; // Replace with the actual Boat settings URL
            case 'navigation':
                return 'https://demo.signalk.org/@signalk/freeboard-sk/';
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
            {view == 'manual' ? ( <PDFList path="boats/dufour310/docs"/>): ""}
        
        
            {iframeSrc() ? (
                <iframe
                    className="flex-grow border-none"
                    src={iframeSrc()} // Load dynamic content based on the selected view
                    title="External Application"
                />
            ) :"" }
        </div>
    );
};

export default RightPane;
