import axios from "axios";

class Axios {

    async getRequest(url: string) {
        let res = await axios.get(url);
        return res.data;      
    }
}
export default new Axios();