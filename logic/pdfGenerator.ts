
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getFormattedDate } from './utils';

// Define interface for the data we expect
interface AttendanceRecord {
    rank_today: number;
    students?: {
        name: string;
        batch: string;
    };
    checkin_time: string;
    points: number;
}

export const generateAttendancePDF = (
    date: string,
    totalStudents: number,
    attendanceData: AttendanceRecord[]
) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(55, 65, 81); // Dark gray
    doc.text('ZenStudy Attendance Report', 14, 20);

    // Subheader
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray
    doc.text(`Report Date: ${date}`, 14, 28);
    doc.text(`Wings Coaching Centre Karakunnu`, 14, 33);

    // Stats
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55); // Darker
    doc.text(
        `Total Attendance: ${attendanceData.length} / ${totalStudents}`,
        14,
        45
    );

    // Table Data Preparation
    const tableBody = attendanceData.map((record) => [
        record.rank_today,
        record.students?.name || 'N/A',
        record.students?.batch || 'N/A',
        new Date(record.checkin_time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        }),
        record.points,
    ]);

    // Generate Table
    autoTable(doc, {
        startY: 55,
        head: [['Rank', 'Name', 'Batch', 'Time', 'Points']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [99, 102, 241], // Indigo-500
            textColor: 255,
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 10,
            font: 'helvetica',
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251], // Gray-50
        },
    });

    // Save File
    doc.save(`ZenStudy_Report_${date}.pdf`);
};
