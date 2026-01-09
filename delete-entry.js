async function deleteJan2026() {
    try {
        const response = await fetch('http://localhost:3000/wealth');
        const snapshots = await response.json();
        const jan2026 = snapshots.find(s => s.month === 'Jan' && s.year === 2026);

        if (jan2026) {
            console.log('Found Jan 2026 entry:', jan2026.id);
            const delResponse = await fetch(`http://localhost:3000/wealth/${jan2026.id}`, {
                method: 'DELETE'
            });
            if (delResponse.ok) {
                console.log('Successfully deleted Jan 2026 entry');
            } else {
                console.log('Failed to delete:', delResponse.status, delResponse.statusText);
            }
        } else {
            console.log('Jan 2026 entry not found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

deleteJan2026();
