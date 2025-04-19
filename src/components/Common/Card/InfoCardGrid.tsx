import React from 'react';
import { InfoCard, InfoCardGridProps } from '@/types/type';

const InfoCardGrid: React.FC<InfoCardGridProps> = ({ cards }) => {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
                <div key={index} className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-lg font-bold">{card.title}</h2>
                    <p className="text-2xl">{card.value}</p>
                </div>
            ))}
        </div>
    );
};

export default InfoCardGrid;