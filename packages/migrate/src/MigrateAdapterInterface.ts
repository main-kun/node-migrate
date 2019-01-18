export default interface MigrateAdapterInterface {
    execute(): void;
    connect(): Promise<void>;
    closeConnection(): Promise<void>;
    getApplied(): Promise<Array<string>>;
    addApplied(name: string): Promise<void>; 
}
