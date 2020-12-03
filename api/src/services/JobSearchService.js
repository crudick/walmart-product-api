
export async function searchJobs(search) {
    const response = await fetch(`/api/linkedin?keywords=${search.keywords}&city=${search.city}&state=${search.state}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
      })
    return await response.json();
}