import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import PDFDocument from "pdfkit";

export const generatePdfRouter = createTRPCRouter({
    generateCutoffPdf: publicProcedure
        .input(
            z.object({
                results: z.array(
                    z.object({
                        collegeName: z.string(),
                        courseName: z.string(),
                        capRound: z.string(),
                        stage: z.string(),
                        category: z.string(),
                        requiredPercent: z.number(),
                        yourPercent: z.number().optional(),
                        eligible: z.boolean(),
                    })
                ),
            })
        )
        .mutation(async ({ input }) => {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            
            // Title
            doc.font('Helvetica-Bold').fontSize(20).text('College Cutoff Results', { align: 'center' });
            doc.moveDown(2);

            // Table configuration
            const tableTop = doc.y;
            const minItemHeight = 20;
            const lineHeight = 12;
            const cellPadding = 4;
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            
            // Column widths (adjusted for 4 columns)
            const columnWidths = {
                college: 210,
                course: 160,
                category: 80,
                required: 80
            };

            // Column positions
            let xPosition = doc.page.margins.left;
            const columnPositions = {
                college: xPosition,
                course: xPosition += columnWidths.college,
                category: xPosition += columnWidths.course,
                required: xPosition += columnWidths.category
            };

            // Function to calculate text height
            const getTextHeight = (text: string, width: number, fontSize: number): number => {
                doc.fontSize(fontSize);
                const textWidth = doc.widthOfString(text);
                const lines = Math.ceil(textWidth / (width - cellPadding * 2));
                return Math.max(lines * lineHeight + cellPadding * 2, minItemHeight);
            };

            // Function to calculate row height
            const getRowHeight = (row: any): number => {
                const heights = [
                    getTextHeight(row.collegeName, columnWidths.college, 10),
                    getTextHeight(row.courseName, columnWidths.course, 10),
                    getTextHeight(row.category, columnWidths.category, 10),
                    getTextHeight(row.requiredPercent.toString(), columnWidths.required, 10)
                ];
                return Math.max(...heights);
            };

            // Function to draw table header
            const drawTableHeader = (y: number) => {
                const headerHeight = minItemHeight;
                
                doc.font('Helvetica-Bold').fontSize(12);
                
                // Draw header background
                doc.rect(doc.page.margins.left, y, pageWidth, headerHeight)
                   .fillColor('#f0f0f0')
                   .fill();

                // Reset fill color for text
                doc.fillColor('black');

                // Header text - centered vertically
                const textY = y + (headerHeight - lineHeight) / 2;
                
                doc.text('College Name', columnPositions.college + cellPadding, textY, { 
                    width: columnWidths.college - cellPadding * 2,
                    align: 'left'
                });
                doc.text('Course', columnPositions.course + cellPadding, textY, { 
                    width: columnWidths.course - cellPadding * 2,
                    align: 'left'
                });
                doc.text('Category', columnPositions.category + cellPadding, textY, { 
                    width: columnWidths.category - cellPadding * 2,
                    align: 'center'
                });
                doc.text('Required %', columnPositions.required + cellPadding, textY, { 
                    width: columnWidths.required - cellPadding * 2,
                    align: 'center'
                });

                // Draw header borders
                doc.strokeColor('black').lineWidth(1);
                
                // Horizontal lines
                doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageWidth, y).stroke();
                doc.moveTo(doc.page.margins.left, y + headerHeight).lineTo(doc.page.margins.left + pageWidth, y + headerHeight).stroke();
                
                // Vertical lines
                Object.values(columnPositions).forEach(pos => {
                    doc.moveTo(pos, y).lineTo(pos, y + headerHeight).stroke();
                });
                doc.moveTo(columnPositions.required + columnWidths.required, y).lineTo(columnPositions.required + columnWidths.required, y + headerHeight).stroke();

                return headerHeight;
            };

            // Function to draw table row
            const drawTableRow = (row: any, y: number, rowIndex: number) => {
                const rowHeight = getRowHeight(row);
                
                doc.font('Helvetica').fontSize(10);

                // Alternate row background
                if (rowIndex % 2 === 0) {
                    doc.rect(doc.page.margins.left, y, pageWidth, rowHeight)
                       .fillColor('#f9f9f9')
                       .fill();
                }
                
                doc.fillColor('black');

                // Row data with proper text wrapping
                doc.text(row.collegeName, columnPositions.college + cellPadding, y + cellPadding, { 
                    width: columnWidths.college - cellPadding * 2,
                    height: rowHeight - cellPadding * 2,
                    align: 'left'
                });
                doc.text(row.courseName, columnPositions.course + cellPadding, y + cellPadding, { 
                    width: columnWidths.course - cellPadding * 2,
                    height: rowHeight - cellPadding * 2,
                    align: 'left'
                });
                doc.text(row.category, columnPositions.category + cellPadding, y + cellPadding, { 
                    width: columnWidths.category - cellPadding * 2,
                    height: rowHeight - cellPadding * 2,
                    align: 'center'
                });
                doc.text(row.requiredPercent.toString(), columnPositions.required + cellPadding, y + cellPadding, { 
                    width: columnWidths.required - cellPadding * 2,
                    height: rowHeight - cellPadding * 2,
                    align: 'center'
                });

                // Draw row borders
                doc.strokeColor('black').lineWidth(0.5);
                
                // Horizontal lines
                doc.moveTo(doc.page.margins.left, y + rowHeight).lineTo(doc.page.margins.left + pageWidth, y + rowHeight).stroke();
                
                // Vertical lines
                Object.values(columnPositions).forEach(pos => {
                    doc.moveTo(pos, y).lineTo(pos, y + rowHeight).stroke();
                });
                doc.moveTo(columnPositions.required + columnWidths.required, y).lineTo(columnPositions.required + columnWidths.required, y + rowHeight).stroke();

                return rowHeight;
            };

            // Check if we need a new page
            const checkNewPage = (currentY: number, requiredHeight: number) => {
                if (currentY + requiredHeight > doc.page.height - doc.page.margins.bottom) {
                    doc.addPage();
                    return doc.page.margins.top;
                }
                return currentY;
            };

            // Draw table
            let currentY = tableTop;
            
            // Draw header
            currentY = checkNewPage(currentY, minItemHeight);
            const headerHeight = drawTableHeader(currentY);
            currentY += headerHeight;

            // Draw rows
            input.results.forEach((row, index) => {
                const rowHeight = getRowHeight(row);
                currentY = checkNewPage(currentY, rowHeight);
                const actualRowHeight = drawTableRow(row, currentY, index);
                currentY += actualRowHeight;
            });

            doc.end();
            
            const pdfBuffer: Buffer = await new Promise((resolve) => {
                const bufs: Buffer[] = [];
                doc.on('data', (d: Buffer) => bufs.push(d));
                doc.on('end', () => {
                    resolve(Buffer.concat(bufs));
                });
            });
            
            return pdfBuffer.toString('base64');
        }),
});
