import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';

const PDFList = ({ path }) => {
    const [pdfFiles, setPdfFiles] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const viewerRef = useRef(null);

    useEffect(() => {
        const fetchPdfFiles = async () => {
            try {
                const response = await fetch(`${path}/index.json`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setPdfFiles(data);
                if (data.length > 0) setSelectedPdf(data[0]);
            } catch (error) {
                console.error('Error fetching PDF files:', error);
            }
        };
        fetchPdfFiles();
    }, [path]);

    return (
        <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden" ref={viewerRef}>
            {/* Tab Navigation - Tesla Style */}
            <div className="flex border-b border-hud bg-hud-bg overflow-x-auto scrollbar-hide">
                {pdfFiles.map((pdf, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedPdf(pdf)}
                        className={`flex-1 py-3 px-2 text-xs font-black uppercase flex items-center justify-center transition-all duration-500 whitespace-nowrap ${
                            selectedPdf?.file === pdf.file
                                ? 'text-oGreen border-b-2 border-oGreen bg-hud-bg'
                                : 'text-hud-secondary hover:text-hud-main tesla-hover'
                        }`}
                    >
                        <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                        {pdf.title}
                    </button>
                ))}
            </div>

            {/* PDF Viewer */}
            <div className="flex-grow bg-hud-bg text-hud-main flex items-center justify-center">
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
