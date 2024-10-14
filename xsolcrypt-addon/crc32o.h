#ifndef _Lib_crc32o_h_
#define _Lib_crc32o_h_


class crc32o
{
		static bool table_init;
		static unsigned int crc32tab[256]; 
	
		void make_table(void);
		unsigned int crc32;
	
	public:
		crc32o(unsigned int crc32=0);
		void put(const unsigned char *buf,int count);
		void put(unsigned char b);
		unsigned int getcrc() {return crc32;};
};
#endif
