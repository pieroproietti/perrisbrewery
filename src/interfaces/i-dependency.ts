export interface IDependency {
    arch: {
        [key: string]: string[]; // Add this line
        amd64: string[],
        arm64: string[],
        i386: string[],
    }
    common: string[],
    version: {
        [key: string]: string[]; // Add this line
        jessie: string[],
        stretch: string[],
    }
}
