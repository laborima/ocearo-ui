import React, { useState, useEffect, useRef } from 'react';

const PDFList = ({ path }) => {
    const [pdfFiles, setPdfFiles] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const viewerRef = useRef(null); // Ref for fullscreen

    // Fetch PDF files from the JSON file
    useEffect(() => {
        const fetchPdfFiles = async () => {
            try {
                const response = await fetch(`${path}/index.json`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setPdfFiles(data);
                if (data.length > 0) setSelectedPdf(data[0]); // Set first PDF as default
            } catch (error) {
                console.error('Error fetching PDF files:', error);
            }
        };
        fetchPdfFiles();
    }, [path]);

    // Toggle Fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            viewerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="flex flex-col h-full" ref={viewerRef}>
            {/* Top Tabs for PDF list */}
            <div className="bg-oGray2 text-white p-4 flex space-x-4">
                {pdfFiles.map((pdf, index) => (
                    <button
                        key={index}
                        className={`px-4 py-2 rounded-t ${selectedPdf?.file === pdf.file ? 'bg-oGray font-bold' : 'hover:bg-oGray'}`}
                        onClick={() => setSelectedPdf(pdf)}
                    >
                        {pdf.title}
                    </button>
                ))}
                <button
                    onClick={toggleFullscreen}
                    className="ml-auto bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Toggle Fullscreen
                </button>
            </div>

            {/* PDF Viewer using iframe */}
            <div className="flex-grow bg-oGray2 text-white p-4 flex items-center justify-center">
                {selectedPdf && (
                    <iframe
                        src={`${path}/${selectedPdf.file}`}
                        title="PDF Viewer"
                        width="100%"
                        height="100%"
                        style={{ border: "none" }}
                    />
                )}
            </div>
        </div>
    );
};

export default PDFList;
