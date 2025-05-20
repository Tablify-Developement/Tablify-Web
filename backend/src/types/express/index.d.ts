// This adds the file property to all Express Request objects globally
declare namespace Express {
    interface Request {
        file?: Multer.File;
        files?: {
            [fieldname: string]: Multer.File[];
        } | Multer.File[];
    }
}