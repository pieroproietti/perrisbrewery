export interface IDependency {
    common: string[],
    arch: {
        amd64: string[],
        arm64: string[],
        i386: string[],
        [key: string]: string[]; // Add this line
    }
    version: {
        jessie: string[],
        stretch: string[],
        [key: string]: string[]; // Add this line        
    }
}
