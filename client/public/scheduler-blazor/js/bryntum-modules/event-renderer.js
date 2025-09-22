class EventRenderer {
    constructor(schedulerManager) {
        this.schedulerManager = schedulerManager;
    }

    lightenColor(color, percent) {
        let num = parseInt(color.slice(1), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1).toUpperCase()}`;
    }

    getSegmentStyle(segment, isFirst, isLast) {
        const backgroundColor = segment.color || 'rgba(255, 255, 255, 0.2)';
        const borderRadius = this.getBorderRadius(isFirst, isLast);
        const borderColor = segment.transparentBorder ? "#ffffff47"
            : this.lightenColor(segment.color, 40); 
        return `background-color: ${backgroundColor}; border-color: ${borderColor}; ${borderRadius}` + segment.style;
    }

    getBorderRadius(isFirst, isLast) {
        let borderRadius = '';
        if (isFirst) {
            borderRadius += 'border-top-left-radius: 5px; border-top-right-radius: 5px;';
        }
        if (isLast) {
            borderRadius += 'border-bottom-left-radius: 5px; border-bottom-right-radius: 5px;';
        }
        return borderRadius;
    }

    getSegmentHTML(segment, index, segments) {
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;
        const style = this.getSegmentStyle(segment, isFirst, isLast);
        let customHTML = segment.customHTML;

        return `<div class="event-section" style="${style}">
                ${customHTML
                ? segment.customCode
                : `<p>${segment.title}</p>` 
            }
            </div>`;
    }

    render = ({ eventRecord, resourceRecord, renderData }) => {
        renderData.style = `background-color: ${resourceRecord.color};`;
        const segments = eventRecord.data.renderSegments || [];
        const encodeHtml = segments.length > 0
            ? `<section class="b-sch-event-container">${segments.map((segment, index) => this.getSegmentHTML(segment, index, segments)).join('')}</section>`
            : "";

        return encodeHtml;
    }
}

export default EventRenderer;
