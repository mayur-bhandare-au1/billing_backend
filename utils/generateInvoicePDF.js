const { jsPDF } = require('jspdf');

const generateInvoicePDF = (bill, customer, plan) => {
    const doc = new jsPDF();

    // Set Font and Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Cable TV Invoice', 105, 20, { align: 'center' });

    // Company Info (Optional - Add your company details here)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Mayur Cable Network.', 10, 35);
    doc.text('123 Cable Lane, Pune, Maharashtra', 10, 40);
    doc.text('Phone: +91 9876543210 | Email: info@mycable.in', 10, 45);

    // Invoice Details
    doc.setFontSize(12);
    doc.text(`Invoice No: ${bill.invoiceNumber}`, 150, 40);
    doc.text(`Bill Date: ${bill.createdAt.toLocaleDateString('en-IN')}`, 150, 47);
    doc.text(`Due Date: ${bill.dueDate.toLocaleDateString('en-IN')}`, 150, 54);

    // Customer Details
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 10, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${customer.name}`, 10, 72);
    doc.text(`Address: ${customer.address}, ${customer.area}`, 10, 79);
    doc.text(`Phone: ${customer.phone}`, 10, 86);
    if (customer.stbNumber) {
        doc.text(`STB No: ${customer.stbNumber}`, 10, 93);
    }

    // Line Items (Simplified for one plan per bill)
    let yPos = 110;
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 10, yPos);
    doc.text('Amount (Rs.)', 170, yPos);
    doc.line(10, yPos + 2, 200, yPos + 2); // Underline

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`${plan.name} - ${plan.description || 'Monthly Service'}`, 10, yPos);
    doc.text(bill.totalAmount.toFixed(2), 170, yPos, { align: 'right' });
    yPos += 7;

    // Summary
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 10, yPos);
    doc.setFont('helvetica', 'normal');

    yPos += 7;
    doc.text(`Current Month's Charges:`, 140, yPos);
    doc.text(bill.totalAmount.toFixed(2), 170, yPos, { align: 'right' });

    yPos += 7;
    doc.text(`Previous Balance Carried:`, 140, yPos);
    doc.text(bill.previousBalance.toFixed(2), 170, yPos, { align: 'right' });

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Due:`, 140, yPos);
    doc.text(bill.currentBalance.toFixed(2), 170, yPos, { align: 'right' });
    doc.line(140, yPos + 2, 200, yPos + 2); // Underline total due

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount Paid (this invoice):`, 140, yPos);
    doc.text(bill.paidAmount.toFixed(2), 170, yPos, { align: 'right' });

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Remaining Balance:`, 140, yPos);
    doc.text((bill.currentBalance - bill.paidAmount).toFixed(2), 170, yPos, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your timely payment!', 105, doc.internal.pageSize.height - 20, { align: 'center' });
    doc.text('This is an computer generated invoice, no signature required.', 105, doc.internal.pageSize.height - 15, { align: 'center' });


    console.log(`Generated PDF for Invoice No: ${bill.invoiceNumber} for Customer: ${customer.name}`);
    return doc.output('arraybuffer'); // Returns an ArrayBuffer
};

module.exports = generateInvoicePDF;