import MySQLHelper from "./mysql.db";

class Repository {
    protected pool = MySQLHelper.getInstance().getPool();
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    private toCamelCase(obj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const key in obj) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = obj[key];
        }
        return result;
    }

    private mapRows(rows: any[]): any[] {
        return rows.map((row) => this.toCamelCase(row));
    }

    async findAll(): Promise<any[]> {
        const query = `SELECT * FROM ${this.tableName}`;
        const [rows] = await this.pool.query(query);
        return rows as any[];
    }

    async insert(data: Record<string, any>): Promise<number> {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const query = `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`;
        const [result]: any = await this.pool.query(query, values);
        return result.insertId;
    }

    async update(id: string, data: Record<string, any>): Promise<boolean> {
        const fields = Object.keys(data).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(data);

        const query = `UPDATE ${this.tableName} SET ${fields} WHERE _id = ?`;
        const [result]: any = await this.pool.query(query, [...values, id]);
        return result.affectedRows > 0;
    }

    async delete(id: string): Promise<boolean> {
        const query = `DELETE FROM ${this.tableName} WHERE _id = ?`;
        const [result]: any = await this.pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    async findByCondition(condition: string, values: any[]): Promise<any[]> {
        const query = `SELECT * FROM ${this.tableName} WHERE ${condition}`;
        const [rows] = await this.pool.query(query, values);
        console.log("Rows: ", rows);
        return this.mapRows(rows as any[]);
    }
}

export default Repository;