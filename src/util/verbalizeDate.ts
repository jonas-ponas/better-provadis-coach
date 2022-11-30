
export default function verbalizeDate(date: Date|string) {
    if(typeof date == "string") {
        date = new Date(date)
    }
    
    const now = new Date()

    const diff = Math.abs(date.getTime() - now.getTime()) 
    if(diff < (7 * 24 * 60 * 60)) {
        if(diff < (60 * 60)) return `vor ${Math.floor(diff / 60)} Minuten`
        if(diff < (24 * 60 * 60)) return `vor ${Math.floor(diff / (60*60))} Stunden`
        return `vor ${Math.floor(diff / 24 * 60 * 60)} Tagen`
    } 
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
    const month = (date.getMonth()+1) < 10 ? `0${date.getMonth()+1}` : (date.getMonth()+1)
    const hour = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
    const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
    return `${day}.${month}.${date.getFullYear()} ${hour}:${minutes}`
}